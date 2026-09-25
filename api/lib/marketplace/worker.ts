import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import { db, check, getOrder, transition } from "./service"
import { reconcileAttempt } from "./payments"

const messages: Record<string, string> = {
  en: "Your Ciuna order has an update. Open your order to view its current status and next steps.",
  ru: "Ваш заказ Ciuna обновлён. Откройте заказ, чтобы увидеть статус и дальнейшие действия.",
  fr: "Votre commande Ciuna a été mise à jour. Consultez son statut et les prochaines étapes.",
  es: "Tu pedido de Ciuna se ha actualizado. Consulta su estado y los próximos pasos.",
}
async function notify(payload: any) {
  const order = await getOrder(payload.orderId, undefined, true)
  const { data: user, error } = await db()
    .from("users")
    .select("preferred_language")
    .eq("id", (order as any).user_id)
    .single()
  check(error)
  const locale = user?.preferred_language || "en"
  const text = `${messages[locale] || messages.en}\n${order.public_id}\n${(process.env.NEXT_PUBLIC_APP_URL || "https://app.ciuna.com").replace(/\/$/, "")}/hub/orders/${order.public_id.toLowerCase()}`
  const client = new SESv2Client({ region: process.env.SES_REGION })
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: process.env.SES_FROM_EMAIL || "hello@ciuna.com",
      Destination: { ToAddresses: [order.snapshot.contactEmail] },
      Content: {
        Simple: {
          Subject: { Data: `Ciuna · ${order.public_id}`, Charset: "UTF-8" },
          Body: { Text: { Data: text, Charset: "UTF-8" } },
        },
      },
      EmailTags: [{ Name: "marketplace_event", Value: payload.eventId }],
    }),
  )
}
export async function runMarketplaceWorker() {
  const { error: health } = await db()
    .from("marketplace_worker_health")
    .upsert({ id: "marketplace", last_started_at: new Date().toISOString() })
  check(health)
  const { error: overdue } = await db().rpc("marketplace_detect_overdue")
  check(overdue)
  const { data: jobs, error } = await db().rpc("marketplace_claim_jobs", { p_limit: 10 })
  check(error)
  const results = await Promise.all(
    (jobs || []).map(async (job: any) => {
      let done = true,
        errorCode: string | null = null
      try {
        if (job.kind === "expire") await transition(job.payload.orderId, "expire", null)
        else if (job.kind === "reconcile") done = await reconcileAttempt(job.payload.attemptId)
        else if (job.kind === "notify") await notify(job.payload)
        else throw new Error("UNKNOWN_JOB")
      } catch (e) {
        done = false
        errorCode = e instanceof Error ? e.message.slice(0, 160) : "JOB_FAILED"
      }
      // Provider reconciliation stays retryable; notification failures become operator-visible.
      const failed = job.kind === "notify" && job.attempts >= 10 && !done
      const delay = Math.min(3600, 60 * 2 ** Math.min(job.attempts - 1, 6))
      const { error } = await db()
        .from("marketplace_jobs")
        .update({
          state: done ? "done" : failed ? "failed" : "ready",
          lease_until: null,
          lease_token: null,
          available_at: new Date(Date.now() + delay * 1000).toISOString(),
          last_error: errorCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("lease_token", job.lease_token)
      check(error)
      return { id: job.id, done, error: errorCode }
    }),
  )
  const { error: finish } = await db()
    .from("marketplace_worker_health")
    .upsert({
      id: "marketplace",
      last_completed_at: new Date().toISOString(),
      last_error: results.some((r: any) => r.error) ? "One or more jobs need attention" : null,
    })
  check(finish)
  return { processed: results.length, failed: results.filter((r: any) => r.error).length }
}

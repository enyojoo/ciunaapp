import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import { resolveSellerUrl } from "@ciuna/shared"
import { createServerClient } from "@/lib/supabase"
import { zoneForCountry, renderAlert, type AlertKind } from "./notify-messages"

const db = () => createServerClient()

export interface Senders {
  email: (to: string, subject: string, html: string, text: string) => Promise<void>
  telegram: (chatId: number, text: string, url: string, openLabel: string) => Promise<void>
}

let ses: SESv2Client | null = null
export const defaultSenders: Senders = {
  async email(to, subject, html, text) {
    const region = process.env.SES_REGION
    if (!region) throw new Error("SES_NOT_CONFIGURED")
    ses = ses ?? new SESv2Client({ region })
    const from = `${process.env.SES_FROM_NAME || "Ciuna"} <${process.env.SES_FROM_EMAIL || "hello@ciuna.com"}>`
    await ses.send(new SendEmailCommand({ FromEmailAddress: from, Destination: { ToAddresses: [to] }, Content: { Simple: { Subject: { Data: subject, Charset: "UTF-8" }, Body: { Html: { Data: html, Charset: "UTF-8" }, Text: { Data: text, Charset: "UTF-8" } } } } }))
  },
  async telegram(chatId, text, url, openLabel) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) throw new Error("TELEGRAM_NOT_CONFIGURED")
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true, reply_markup: { inline_keyboard: [[{ text: openLabel, url }]] } }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      // 403 = the user blocked the bot: permanent, do not retry
      if (res.status === 403) throw Object.assign(new Error("TELEGRAM_BLOCKED"), { permanent: true })
      throw new Error(`TELEGRAM_${res.status}:${j.description || ""}`)
    }
  },
}

/** Drains due outbox rows. Each row is sent at most once per claim; failures retry with backoff (see seller_outbox_claim). */
export async function processSellerOutbox(limit = 25, senders: Senders = defaultSenders) {
  const claimed = await db().rpc("seller_outbox_claim", { p_limit: limit })
  if (claimed.error) throw new Error(claimed.error.message)
  const rows = (claimed.data || []) as any[]
  let sent = 0, failed = 0, skipped = 0
  for (const row of rows) {
    try {
      const [{ data: user }, { data: merchant }, { data: link }] = await Promise.all([
        db().from("users").select("email,preferred_language").eq("id", row.user_id).maybeSingle(),
        db().from("merchants").select("display_name,operating_country").eq("id", row.merchant_id).maybeSingle(),
        db().from("telegram_links").select("chat_id").eq("user_id", row.user_id).maybeSingle(),
      ])
      if (!user || !merchant || (row.channel === "telegram" && !link)) {
        await db().rpc("seller_outbox_done", { p_id: row.id, p_status: "skipped", p_error: "recipient unavailable" })
        skipped++
        continue
      }
      const msg = renderAlert(row.kind as AlertKind, row.payload, { lang: user.preferred_language || "en", merchantName: merchant.display_name, portalUrl: resolveSellerUrl(), timeZone: zoneForCountry((merchant as any).operating_country) })
      if (row.channel === "email") await senders.email(user.email, msg.title, msg.html, msg.text)
      else await senders.telegram(link!.chat_id, `${msg.title}\n${msg.body}`, msg.url, msg.openLabel)
      await db().rpc("seller_outbox_done", { p_id: row.id, p_status: "sent" })
      sent++
    } catch (e: any) {
      const message = String(e?.message || e).slice(0, 300)
      const permanent = e?.permanent || message === "SES_NOT_CONFIGURED" || message === "TELEGRAM_NOT_CONFIGURED"
      // not configured / blocked: stop retrying (skipped); transient: leave in 'sending' so the claim backoff retries it
      if (permanent) await db().rpc("seller_outbox_done", { p_id: row.id, p_status: "skipped", p_error: message })
      else await db().rpc("seller_outbox_done", { p_id: row.id, p_status: row.attempts >= 6 ? "failed" : "sending", p_error: message })
      failed++
    }
  }
  return { claimed: rows.length, sent, failed, skipped }
}

import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { can } from "@/lib/merchant/permissions"
import { setting } from "@/lib/merchant/money"
import { zoneForCountry } from "@/lib/merchant/notify-messages"
import { DEFAULT_DOCUMENT_WARNING_DAYS, DEFAULT_LOW_STOCK_THRESHOLD, expiringDocuments, lowStock, ordersDelta, startOfDayInZone, sumEarnings } from "@/lib/merchant/home"

const db = () => createServerClient()
const PAID = ["paid", "refund_pending", "refunded"]

/** A table or column that the live database does not have yet must not take Home down: the field is simply omitted. */
async function safe<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn()
  } catch (e: any) {
    const code = e?.code
    if (code === "42P01" || code === "42703" || code === "PGRST205" || code === "PGRST204") return undefined
    console.error("home aggregate part failed", e?.message ?? e)
    return undefined
  }
}
function ok<R extends { error: any }>(r: R): R {
  if (r.error) throw r.error
  return r
}

/**
 * Everything Seller Home shows beyond the counts, in one call, filtered by what the member's role may see:
 * today's earnings (earnings), low stock (catalog), documents about to expire (documents), orders received today vs yesterday (orders).
 */
export const GET = merchantRoute(null, async (_req, { merchant, role }) => {
  const zone = zoneForCountry(merchant.operating_country)
  const now = new Date()
  const dayStart = startOfDayInZone(now, zone)
  const yesterdayStart = startOfDayInZone(new Date(dayStart.getTime() - 3_600_000), zone)
  const out: Record<string, unknown> = { timeZone: zone }

  const jobs: Array<Promise<void>> = []
  if (can(role, "earnings")) {
    jobs.push(
      (async () => {
        const rows = await safe(async () => ok(await db().from("merchant_earnings").select("currency,subtotal,delivery_fee,commission,net,status").eq("merchant_id", merchant.id).gte("fulfilled_at", dayStart.toISOString()).limit(1000)).data)
        if (rows) out.today = sumEarnings(rows as any, merchant.default_currency) ?? sumEarnings(rows as any, (rows as any)[0]?.currency ?? "")
      })(),
    )
  }
  if (can(role, "catalog") && merchant.type === "store") {
    jobs.push(
      (async () => {
        const threshold = Number(await safe(() => setting<number>("low_stock_threshold", DEFAULT_LOW_STOCK_THRESHOLD))) || DEFAULT_LOW_STOCK_THRESHOLD
        const rows = await safe(async () => ok(await db().from("hub_products").select("id,title,stock_quantity,sold_out,status").eq("merchant_id", merchant.id).eq("status", "live").not("stock_quantity", "is", null).lte("stock_quantity", threshold).limit(50)).data)
        if (rows) out.lowStock = lowStock(rows as any, threshold).slice(0, 3).map((p: any) => ({ id: p.id, title: p.title, stock: p.stock_quantity }))
      })(),
    )
  }
  if (can(role, "documents")) {
    jobs.push(
      (async () => {
        const days = Number(await safe(() => setting<number>("document_expiry_warning_days", DEFAULT_DOCUMENT_WARNING_DAYS))) || DEFAULT_DOCUMENT_WARNING_DAYS
        const rows = await safe(async () => ok(await db().from("merchant_documents").select("id,kind,status,expires_at").eq("merchant_id", merchant.id).not("expires_at", "is", null).limit(100)).data)
        if (rows) out.documentsExpiring = expiringDocuments(rows as any, now, days).slice(0, 3).map((d: any) => ({ id: d.id, kind: d.kind, expiresAt: d.expires_at }))
      })(),
    )
  }
  if (can(role, "orders")) {
    jobs.push(
      (async () => {
        const count = async (from: Date, to: Date | null) => {
          let q = db().from("marketplace_orders").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).in("payment_state", PAID).gte("created_at", from.toISOString())
          if (to) q = q.lt("created_at", to.toISOString())
          return ok(await q).count ?? 0
        }
        const [today, yesterday] = (await safe(() => Promise.all([count(dayStart, null), count(yesterdayStart, dayStart)]))) ?? [undefined, undefined]
        if (today !== undefined && yesterday !== undefined) {
          out.ordersToday = today
          const d = ordersDelta(today, yesterday)
          if (d) out.delta = { orders: d }
        }
      })(),
    )
  }
  await Promise.all(jobs)
  return out
})

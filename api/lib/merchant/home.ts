/** Pure helpers behind GET /api/merchant/home and the seller screens' derived fields. No database access, so they are unit-tested. */

export const DEFAULT_LOW_STOCK_THRESHOLD = 5
export const DEFAULT_DOCUMENT_WARNING_DAYS = 30

/** Offset in minutes of `zone` from UTC at `at` (positive east). */
export function zoneOffsetMinutes(zone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }).formatToParts(at)
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"))
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000)
}

/** The instant the local day containing `now` began in `zone`. */
export function startOfDayInZone(now: Date, zone: string): Date {
  const off = zoneOffsetMinutes(zone, now)
  const local = new Date(now.getTime() + off * 60000)
  const midnightLocalAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
  // The offset can differ at midnight (DST); re-evaluate once.
  const guess = new Date(midnightLocalAsUtc - off * 60000)
  const off2 = zoneOffsetMinutes(zone, guess)
  return new Date(midnightLocalAsUtc - off2 * 60000)
}

export interface EarningRow { currency: string; subtotal: number | string; delivery_fee: number | string; commission: number | string; net: number | string; status?: string }

/** Totals for one currency. Reversed rows are left out. Gross is items plus delivery, as the seller sees it on the statement. */
export function sumEarnings(rows: EarningRow[], currency: string) {
  const mine = rows.filter((r) => r.currency === currency && r.status !== "reversed")
  if (!mine.length) return null
  const n = (v: number | string) => Number(v) || 0
  const gross = mine.reduce((s, r) => s + n(r.subtotal) + n(r.delivery_fee), 0)
  const fee = mine.reduce((s, r) => s + n(r.commission), 0)
  const net = mine.reduce((s, r) => s + n(r.net), 0)
  return { orders: mine.length, gross: round2(gross), fee: round2(fee), net: round2(net), currency }
}
const round2 = (v: number) => Math.round(v * 100) / 100

export function lowStock<T extends { stock_quantity: number | null; sold_out?: boolean; status?: string }>(products: T[], threshold: number): T[] {
  return products.filter((p) => p.status !== "archived" && !p.sold_out && p.stock_quantity !== null && p.stock_quantity <= threshold).sort((a, b) => (a.stock_quantity as number) - (b.stock_quantity as number))
}

/** Documents that expire within `days` (or already have): earliest first. `expires_at` is a date string. */
export function expiringDocuments<T extends { expires_at: string | null; status?: string }>(docs: T[], now: Date, days: number): T[] {
  const limit = now.getTime() + days * 86_400_000
  return docs
    .filter((d) => d.expires_at && d.status !== "rejected" && new Date(`${d.expires_at}T23:59:59Z`).getTime() <= limit)
    .sort((a, b) => String(a.expires_at).localeCompare(String(b.expires_at)))
}

/** Rule behind a commission, from the order_fees snapshot. The client words it ("Food 8%"). */
export function feeRuleOf(snapshot: any, line: string | null | undefined) {
  if (!snapshot || typeof snapshot !== "object" || snapshot.source === "none") return null
  const percent = snapshot.percent === null || snapshot.percent === undefined ? null : Number(snapshot.percent)
  const fixed = snapshot.fixed === null || snapshot.fixed === undefined ? null : Number(snapshot.fixed)
  if (percent === null && fixed === null) return null
  return { line: line ?? null, source: String(snapshot.source ?? ""), percent, fixed, currency: snapshot.currency ?? null }
}

export const SELLER_REJECT_PREFIX = "Rejected by seller: "
/** The reason a seller gave when rejecting, without the internal prefix. */
export function rejectReasonOf(details: any): string | null {
  const raw = typeof details?.reason === "string" ? details.reason : ""
  const reason = raw.startsWith(SELLER_REJECT_PREFIX) ? raw.slice(SELLER_REJECT_PREFIX.length) : raw
  return reason.trim() || null
}

export const DEFAULT_REVERSAL_MEMO = "Refund after fulfilment"
/** A reversal memo is shown only when someone wrote one; the default is internal wording. */
export function reversalReasonOf(memo: string | null | undefined): string | null {
  const m = (memo ?? "").trim()
  return m && m !== DEFAULT_REVERSAL_MEMO ? m : null
}

/** Orders received today against yesterday; omitted when equal or both zero. */
export function ordersDelta(today: number, yesterday: number) {
  if (today === yesterday) return null
  return { direction: today > yesterday ? ("up" as const) : ("down" as const), amount: Math.abs(today - yesterday) }
}

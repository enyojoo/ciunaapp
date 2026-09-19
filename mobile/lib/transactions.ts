import type { CombinedTransaction } from "./types"

export const REFERRAL_PAYOUT_PREFIX = "REFERRAL_PAYOUT:"

export function isReferralPayout(tx: Pick<CombinedTransaction, "reference">): boolean {
  return typeof tx.reference === "string" && tx.reference.startsWith(REFERRAL_PAYOUT_PREFIX)
}

export function isHubTransaction(tx: Pick<CombinedTransaction, "transaction_source" | "type">): boolean {
  return tx.transaction_source === "hub" || tx.type === "hub"
}

export type FilterChip = "all" | "send" | "hub" | "referral"

export function matchesFilterChip(tx: CombinedTransaction, chip: FilterChip): boolean {
  if (chip === "all") return true
  if (chip === "referral") return isReferralPayout(tx)
  if (isReferralPayout(tx)) return false
  return chip === "hub" ? isHubTransaction(tx) : !isHubTransaction(tx)
}

export function matchesSearch(tx: CombinedTransaction, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const productTitle =
    tx.hub_snapshot && typeof tx.hub_snapshot.productTitle === "string" ? tx.hub_snapshot.productTitle : ""
  const haystack = [
    tx.transaction_id,
    tx.recipient?.full_name,
    tx.delivery_address_line,
    productTitle,
    tx.send_amount != null ? String(tx.send_amount) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(q)
}

/** Normalizes legacy/adjacent status values onto the 5 canonical ones for UI purposes. */
export function statusTone(status?: string | null): "pending" | "processing" | "completed" | "failed" | "cancelled" {
  const s = String(status || "").toLowerCase()
  if (s === "completed" || s === "deposited") return "completed"
  if (s === "processing" || s === "converting" || s === "converted") return "processing"
  if (s === "failed") return "failed"
  if (s === "cancelled") return "cancelled"
  return "pending"
}

type TFunc = (key: string, options?: Record<string, unknown>) => string

export function statusLabel(t: TFunc, status?: string | null): string {
  const tone = statusTone(status)
  if (tone === "completed") return t("txTimeline.completed")
  if (tone === "processing") return t("txTimeline.processing")
  if (tone === "failed") return t("orders.statusFailed")
  if (tone === "cancelled") return t("orders.statusCancelled")
  return t("orders.statusPending")
}

export function formatDateTimeLine(dateString?: string | null, locale = "en"): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ""
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  } catch {
    return date.toLocaleString()
  }
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function dayHeading(dateString: string, t: TFunc, locale = "en"): string {
  const date = new Date(dateString)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (dayKey(date) === dayKey(now)) return t("orders.groupToday")
  if (dayKey(date) === dayKey(yesterday)) return t("orders.groupYesterday")
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" })
      .format(date)
      .toUpperCase()
  } catch {
    return date.toDateString()
  }
}

export type TransactionGroup = { heading: string; rows: CombinedTransaction[] }

export function groupByDay(rows: CombinedTransaction[], t: TFunc, locale = "en"): TransactionGroup[] {
  const groups: TransactionGroup[] = []
  for (const tx of rows) {
    if (!tx.created_at) continue
    const heading = dayHeading(tx.created_at, t, locale)
    const last = groups[groups.length - 1]
    if (last && last.heading === heading) last.rows.push(tx)
    else groups.push({ heading, rows: [tx] })
  }
  return groups
}

export type CurrentLimit = { currency: string; monthly_amount: number; min_per_transfer: number | null; max_per_transfer: number | null; used: number; remaining: number; resetsAt: string }
export type LimitIssue = { errorCode: "BELOW_MIN_TRANSFER" | "ABOVE_MAX_TRANSFER" | "LIMIT_EXCEEDED"; details: { currency: string; min?: number; max?: number; remaining?: number; resetsAt: string } }

/** The same rule the server applies, so the amount step can say so before the last tap. Only the limit's own currency is compared. */
export function checkAmount(current: CurrentLimit | null | undefined, currency: string, amount: number): LimitIssue | null {
  if (!current || current.currency !== currency || !Number.isFinite(amount) || amount <= 0) return null
  const base = { currency, resetsAt: current.resetsAt }
  if (current.min_per_transfer != null && amount < current.min_per_transfer) return { errorCode: "BELOW_MIN_TRANSFER", details: { ...base, min: current.min_per_transfer } }
  if (current.max_per_transfer != null && amount > current.max_per_transfer) return { errorCode: "ABOVE_MAX_TRANSFER", details: { ...base, max: current.max_per_transfer } }
  const remaining = Math.max(0, Math.round((current.monthly_amount - current.used) * 100) / 100)
  if (amount > remaining) return { errorCode: "LIMIT_EXCEEDED", details: { ...base, remaining } }
  return null
}

/** "Min ₽1,000 · Max ₽300,000" parts for the line under the amount, or null when the level has no per-transfer limits. */
export function limitRange(current: CurrentLimit | null | undefined, currency: string): { min: number | null; max: number | null } | null {
  if (!current || current.currency !== currency) return null
  if (current.min_per_transfer == null && current.max_per_transfer == null) return null
  return { min: current.min_per_transfer, max: current.max_per_transfer }
}

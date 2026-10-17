import { createServerClient } from "@/lib/supabase"
import { MerchantError } from "@/lib/merchant/errors"

/** Verification level: 1 email and phone, 2 identity approved, 3 identity and address approved. */
export type Submission = { type: string; status: string }
export type LimitRow = { level: number; currency: string; monthly_amount: number; min_per_transfer: number | null; max_per_transfer: number | null }

export function levelFor(subs: Submission[]): 1 | 2 | 3 {
  const ok = (type: string) => subs.some((s) => s.type === type && s.status === "approved")
  if (ok("identity") && ok("address")) return 3
  if (ok("identity")) return 2
  return 1
}

/** A verification waiting for a decision (the current limit still applies meanwhile). */
export const inReview = (subs: Submission[]) => subs.some((s) => s.status === "pending" || s.status === "in_review")

/** The calendar month in UTC that `now` falls in, and when the next one starts (when usage resets). */
export function monthWindow(now: Date = new Date()): { start: Date; resetsAt: Date } {
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    resetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  }
}

const n = (v: unknown) => (v == null ? null : Number(v))
export const normalizeLimit = (r: any): LimitRow => ({ level: Number(r.level), currency: String(r.currency), monthly_amount: Number(r.monthly_amount), min_per_transfer: n(r.min_per_transfer), max_per_transfer: n(r.max_per_transfer) })

/**
 * Whether a transfer fits. Returns null when it does, otherwise the reason and what is left. Only transfers sent in the
 * limit's own currency are compared; any other currency is not limited here.
 */
export function evaluateTransfer(limit: LimitRow | undefined, used: number, amount: number, currency: string) {
  if (!limit || limit.currency !== currency) return null
  if (limit.min_per_transfer != null && amount < limit.min_per_transfer) return { code: "BELOW_MIN_TRANSFER", min: limit.min_per_transfer, currency }
  if (limit.max_per_transfer != null && amount > limit.max_per_transfer) return { code: "ABOVE_MAX_TRANSFER", max: limit.max_per_transfer, currency }
  const remaining = Math.max(0, Math.round((limit.monthly_amount - used) * 100) / 100)
  if (amount > remaining) return { code: "LIMIT_EXCEEDED", remaining, currency }
  return null
}

const db = () => createServerClient()
const tableMissing = (e: { code?: string; message?: string } | null) => Boolean(e && (e.code === "42P01" || e.code === "PGRST205" || /send_limits|send_usage/.test(String(e.message))))

export async function loadLimitState(userId: string, now: Date = new Date()) {
  const { data: subs, error: sErr } = await db().from("kyc_submissions").select("type,status").eq("user_id", userId)
  const submissions: Submission[] = sErr ? [] : (subs as Submission[]) || []
  const level = levelFor(submissions)
  const { data: rows, error } = await db().from("send_limits").select("level,currency,monthly_amount,min_per_transfer,max_per_transfer").order("level")
  if (error) {
    if (tableMissing(error)) return { configured: false as const, level, inReview: inReview(submissions), levels: [], current: null }
    throw new MerchantError("DATABASE_ERROR", 500)
  }
  const levels = (rows || []).map(normalizeLimit)
  const limit = levels.find((l) => l.level === level)
  const { start, resetsAt } = monthWindow(now)
  let current = null
  if (limit) {
    const { data: used, error: uErr } = await db().rpc("send_usage", { p_user: userId, p_currency: limit.currency, p_since: start.toISOString() })
    if (uErr) throw new MerchantError("DATABASE_ERROR", 500)
    const usedNum = Number(used) || 0
    current = { ...limit, used: usedNum, remaining: Math.max(0, Math.round((limit.monthly_amount - usedNum) * 100) / 100), resetsAt: resetsAt.toISOString() }
  }
  return { configured: levels.length > 0, level, inReview: inReview(submissions), levels, current }
}

/** Throws a 409 with the reason and what is left when a Send transfer does not fit the customer's level. */
export async function assertWithinLimits(userId: string, amount: number, currency: string) {
  const state = await loadLimitState(userId)
  if (!state.current) return
  const miss = evaluateTransfer(state.current, state.current.used, amount, currency)
  if (miss) throw new MerchantError(miss.code, 409, { ...miss, resetsAt: state.current.resetsAt, level: state.level })
}

import { createServerClient } from "@/lib/supabase"
import { MerchantError } from "./errors"

export const REVIEW_WINDOW_DAYS = 30
export const REVIEW_EDIT_HOURS = 48
export const REPLY_EDIT_HOURS = 24
export const MAX_BODY = 1000
export const MAX_REPLY = 600

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** A whole number from 1 to 5, or null. Accepts numeric strings ("4") but not 4.5 or 0. */
export function validateRating(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 5) return null
  return n
}

export function cleanText(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max)
}

/** New reviews are accepted for 30 days after the order was fulfilled. */
export function reviewWindowOpen(orderUpdatedAt: string | Date, now = Date.now()): boolean {
  const t = new Date(orderUpdatedAt).getTime()
  return Number.isFinite(t) && now - t <= REVIEW_WINDOW_DAYS * DAY
}

/** A customer can edit their review for 48 hours after writing it. */
export function reviewEditable(createdAt: string | Date, now = Date.now()): boolean {
  const t = new Date(createdAt).getTime()
  return Number.isFinite(t) && now - t <= REVIEW_EDIT_HOURS * HOUR
}

/** A first reply is always allowed; once posted it can be edited for 24 hours. */
export function replyEditable(replyAt: string | Date | null | undefined, now = Date.now()): boolean {
  if (!replyAt) return true
  const t = new Date(replyAt).getTime()
  return Number.isFinite(t) && now - t <= REPLY_EDIT_HOURS * HOUR
}

/** First name only. Never a last name, never an email. */
export function firstName(first?: string | null, fallback: string | null = null): string | null {
  const raw = String(first ?? "").trim()
  if (!raw || raw.includes("@")) return fallback
  return raw.split(/\s+/)[0].slice(0, 40) || fallback
}

/** Office sees a bit more than the public: first name and last initial. */
export function nameWithInitial(first?: string | null, last?: string | null): string | null {
  const f = firstName(first)
  if (!f) return null
  const l = String(last ?? "").trim()
  return l ? `${f} ${l[0].toUpperCase()}.` : f
}

export type Distribution = Record<"1" | "2" | "3" | "4" | "5", number>
export interface ReviewSummary { avg: number | null; count: number; distribution: Distribution }

export function emptyDistribution(): Distribution {
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
}

/** Average (2 decimals, null when there are no reviews), count and 1..5 distribution from per-star counts. */
export function buildSummary(input: Record<string, unknown> | null | undefined): ReviewSummary {
  const distribution = emptyDistribution()
  let count = 0
  let sum = 0
  for (const star of [1, 2, 3, 4, 5] as const) {
    const n = Math.max(0, Math.floor(Number(input?.[String(star)]) || 0))
    distribution[String(star) as keyof Distribution] = n
    count += n
    sum += n * star
  }
  return { avg: count ? Math.round((sum / count) * 100) / 100 : null, count, distribution }
}

/** Same, from a list of ratings (used where only rows are at hand). */
export function summaryFromRatings(ratings: number[]): ReviewSummary {
  const d = emptyDistribution()
  for (const r of ratings) if (r >= 1 && r <= 5) d[String(r) as keyof Distribution]++
  return buildSummary(d)
}

export interface PublicReview {
  id: string
  rating: number
  body: string
  language: string | null
  created_at: string
  customer_first_name: string | null
  reply: string | null
  reply_at: string | null
}

export function toPublicReview(row: any): PublicReview {
  const u = Array.isArray(row.users) ? row.users[0] : row.users
  return {
    id: row.id,
    rating: row.rating,
    body: row.body || "",
    language: row.language ?? null,
    created_at: row.created_at,
    customer_first_name: firstName(u?.first_name),
    reply: row.reply ?? null,
    reply_at: row.reply_at ?? null,
  }
}

export interface Eligibility { canReview: boolean; canEdit: boolean; reason: string | null }

/** Mirrors review_submit so the app can show or hide the prompt. The database remains the authority. */
export function eligibility(
  order: { user_id: string; fulfillment_state: string; merchant_id: string | null; updated_at: string },
  userId: string,
  existing: { created_at: string } | null,
  now = Date.now(),
): Eligibility {
  if (order.user_id !== userId || order.fulfillment_state !== "fulfilled" || !order.merchant_id) {
    return { canReview: false, canEdit: false, reason: "REVIEW_NOT_ALLOWED" }
  }
  if (existing) {
    const canEdit = reviewEditable(existing.created_at, now)
    return { canReview: canEdit, canEdit, reason: canEdit ? null : "ALREADY_REVIEWED" }
  }
  if (!reviewWindowOpen(order.updated_at, now)) return { canReview: false, canEdit: false, reason: "REVIEW_WINDOW_CLOSED" }
  return { canReview: true, canEdit: false, reason: null }
}

const STATUS: Record<string, number> = {
  REVIEW_NOT_ALLOWED: 403,
  ALREADY_REVIEWED: 409,
  RATING_INVALID: 422,
  BODY_TOO_LONG: 422,
  REVIEW_WINDOW_CLOSED: 409,
  REVIEW_NOT_FOUND: 404,
  REPLY_REQUIRED: 422,
  REPLY_TOO_LONG: 422,
  REPLY_LOCKED: 409,
  REASON_REQUIRED: 422,
}

export function reviewErrorStatus(code: string): number {
  return STATUS[code] ?? 400
}

/** Turns a database error from the review functions into a stable error code. */
export function failFromDb(error: { message: string; code?: string } | null): void {
  if (!error) return
  const match = Object.keys(STATUS).find((c) => error.message.includes(c))
  if (match) throw new MerchantError(match, STATUS[match])
  console.error("reviews db error", error.code, error.message)
  throw new MerchantError("DATABASE_ERROR", 500)
}

export function parsePaging(sp: URLSearchParams, max = 50, fallback = 20) {
  const limit = Math.min(Math.max(Number(sp.get("limit")) || fallback, 1), max)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  return { limit, offset }
}

const PUBLIC_COLS = "id,rating,body,language,created_at,reply,reply_at,users(first_name)"

/** Public, published-only list for one merchant and target, newest first. */
export async function listPublicReviews(merchantId: string, target: "vendor" | "expert", limit: number, offset: number) {
  const db = createServerClient()
  const [list, dist] = await Promise.all([
    db.from("reviews").select(PUBLIC_COLS).eq("merchant_id", merchantId).eq("target_type", target).eq("status", "published")
      .order("created_at", { ascending: false }).range(offset, offset + limit - 1),
    db.rpc("review_distribution", { p_merchant: merchantId, p_target: target }),
  ])
  if (list.error) failFromDb(list.error)
  if (dist.error) failFromDb(dist.error)
  return { summary: buildSummary(dist.data as Record<string, unknown>), reviews: (list.data || []).map(toPublicReview) }
}

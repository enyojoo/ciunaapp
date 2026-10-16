export interface Distribution { "1": number; "2": number; "3": number; "4": number; "5": number }
export interface ReviewSummary { avg: number | null; count: number; distribution: Distribution }
export interface SellerReview {
  id: string
  rating: number
  body: string
  language: string | null
  created_at: string
  customer_first_name: string | null
  reply: string | null
  reply_at: string | null
  reply_editable: boolean
}
export interface ReviewsResponse { summary: ReviewSummary; reviews: SellerReview[]; total: number; needs_reply: number }
export type ReviewTab = "all" | "needs_reply"

export const MAX_REPLY = 600
export const PAGE = 20

/** Width of a distribution bar, 0 to 100. */
export function barPercent(n: number, count: number): number {
  return count > 0 ? Math.round((n / count) * 100) : 0
}

export function replyProblem(text: string): "REPLY_REQUIRED" | "REPLY_TOO_LONG" | null {
  const len = text.trim().length
  if (len === 0) return "REPLY_REQUIRED"
  return len > MAX_REPLY ? "REPLY_TOO_LONG" : null
}

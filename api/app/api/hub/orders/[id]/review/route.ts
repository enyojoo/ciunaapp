import { NextRequest } from "next/server"
import { marketplaceRoute } from "@/lib/marketplace/http"
import { MarketplaceError } from "@/lib/marketplace/service"
import { MerchantError } from "@/lib/merchant/errors"
import { createServerClient } from "@/lib/supabase"
import { MAX_BODY, cleanText, eligibility, failFromDb, reviewEditable, toPublicReview, validateRating } from "@/lib/merchant/reviews"

export const dynamic = "force-dynamic"

const OWN_COLS = "id,rating,body,language,status,created_at,updated_at,reply,reply_at,users(first_name)"

async function loadOwn(orderId: string, userId: string) {
  const db = createServerClient()
  const [order, review] = await Promise.all([
    db.from("marketplace_orders").select("id,user_id,merchant_id,fulfillment_state,updated_at").eq("id", orderId).eq("user_id", userId).maybeSingle(),
    db.from("reviews").select(OWN_COLS).eq("order_id", orderId).eq("user_id", userId).maybeSingle(),
  ])
  failFromDb(order.error || review.error)
  return { order: order.data, review: review.data }
}

function view(review: any) {
  return review ? { ...toPublicReview(review), status: review.status, editable: reviewEditable(review.created_at) } : null
}

/** Run review code and surface its stable codes through the marketplace error shape. */
async function asMarketplace<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof MerchantError) throw new MarketplaceError(e.code, e.status)
    throw e
  }
}

/** The caller's review of this order (or null) and whether they can write or edit one now. */
export const GET = marketplaceRoute(async (_req: NextRequest, { params }, user) =>
  asMarketplace(async () => {
    const { order, review } = await loadOwn(String(params.id), user.id)
    if (!order) return { review: null, canReview: false, canEdit: false, reason: "REVIEW_NOT_ALLOWED" }
    const e = eligibility(order as any, user.id, review as any)
    return { review: view(review), canReview: e.canReview, canEdit: e.canEdit, reason: e.reason }
  }),
)

/** Create the review, or edit it within 48 hours. Body: { rating, body?, language? } */
export const POST = marketplaceRoute(async (req: NextRequest, { params }, user) =>
  asMarketplace(async () => {
    const body = await req.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new MarketplaceError("INVALID_REQUEST", 400)
    const rating = validateRating(body.rating)
    if (rating === null) throw new MarketplaceError("RATING_INVALID", 422)
    const text = String(body.body ?? "").trim()
    if (text.length > MAX_BODY) throw new MarketplaceError("BODY_TOO_LONG", 422)
    const { error } = await createServerClient().rpc("review_submit", {
      p_order: String(params.id),
      p_user: user.id,
      p_rating: rating,
      p_body: text,
      p_lang: cleanText(body.language, 12) || null,
    })
    failFromDb(error)
    const { review } = await loadOwn(String(params.id), user.id)
    return { review: view(review) }
  }),
)

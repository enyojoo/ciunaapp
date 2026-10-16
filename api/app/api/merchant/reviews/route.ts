import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { buildSummary, parsePaging, replyEditable, replyEditableUntil, toPublicReview } from "@/lib/merchant/reviews"

export const dynamic = "force-dynamic"

/** ?status=needs_reply|all&limit&offset. Published reviews only; hidden ones are an Office matter. */
export const GET = merchantRoute("orders", async (req, { merchant }) => {
  const sp = new URL(req.url).searchParams
  const { limit, offset } = parsePaging(sp, 100, 30)
  const db = createServerClient()
  let q = db.from("reviews").select("id,rating,body,language,created_at,reply,reply_at,users(first_name)", { count: "exact" })
    .eq("merchant_id", merchant.id).eq("status", "published")
  if (sp.get("status") === "needs_reply") q = q.is("reply", null)
  const [list, dist, needs] = await Promise.all([
    q.order("created_at", { ascending: false }).range(offset, offset + limit - 1),
    db.rpc("review_distribution", { p_merchant: merchant.id, p_target: null }),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id).eq("status", "published").is("reply", null),
  ])
  check(list.error)
  check(dist.error)
  return {
    summary: buildSummary(dist.data as Record<string, unknown>),
    reviews: (list.data || []).map((r: any) => ({ ...toPublicReview(r), reply_editable: Boolean(r.reply) && replyEditable(r.reply_at), reply_editable_until: replyEditableUntil(r.reply_at) })),
    total: list.count ?? 0,
    needs_reply: needs.count ?? 0,
  }
})

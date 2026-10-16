import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { failFromDb } from "@/lib/merchant/reviews"

/** Hide or restore a review. Body: { action: "hide" | "unhide", reason? } (reason required to hide). Always audited. */
export const PATCH = adminRoute("merchants.review", async (req, admin, params) => {
  const body = await readJson(req)
  const action = String(body.action)
  assert(action === "hide" || action === "unhide", "INVALID_ACTION", 422)
  const reason = String(body.reason ?? "").trim().slice(0, 500)
  if (action === "hide") assert(reason.length >= 3, "REASON_REQUIRED", 422)

  const db = createServerClient()
  const before = await db.from("reviews").select("id,merchant_id,status,rating").eq("id", params.id).maybeSingle()
  check(before.error)
  assert(before.data, "REVIEW_NOT_FOUND", 404)
  const { error } = await db.rpc("review_moderate", { p_review: params.id, p_hide: action === "hide", p_reason: reason })
  failFromDb(error)
  await audit({
    actorKind: "admin", actorId: admin.id, actorRole: admin.role, merchantId: before.data.merchant_id,
    action: action === "hide" ? "review.hidden" : "review.unhidden", entityType: "review", entityId: params.id,
    details: { rating: before.data.rating, previousStatus: before.data.status, ...(action === "hide" ? { reason } : {}) },
  })
  const after = await db.from("reviews").select("id,status,hidden_reason").eq("id", params.id).maybeSingle()
  check(after.error)
  return { review: after.data }
})

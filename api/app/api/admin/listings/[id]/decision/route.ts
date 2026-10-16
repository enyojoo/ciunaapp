import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { buildReviewNote, isMissingSchema, isUuid } from "@/lib/merchant/office"
import { loadReasons } from "@/lib/merchant/office-data"

/**
 * Approve or reject a listing in review.
 * approve: { action: "approve" }. reject: { action: "reject", template_key, message? } (message required for "other").
 * The seller sees the chosen template text plus the message verbatim in `review_note` and gets an alert.
 */
export const POST = adminRoute("listings.review", async (req, admin, params) => {
  assert(isUuid(params.id), "LISTING_NOT_FOUND", 404)
  const body = await readJson(req)
  const action = body.action
  assert(action === "approve" || action === "reject", "INVALID_ACTION")
  const db = createServerClient()

  const found = await db.from("hub_products").select("id,title,review_status,merchant_id,status").eq("id", params.id).maybeSingle()
  check(found.error)
  const listing: any = found.data
  assert(listing, "LISTING_NOT_FOUND", 404)
  assert(listing.review_status === "pending", "LISTING_NOT_IN_REVIEW", 409, { review_status: listing.review_status })

  // someone else holds it: only a super admin may decide over their claim
  const claim = await db.from("hub_products").select("review_assigned_to").eq("id", params.id).maybeSingle()
  if (claim.error) assert(isMissingSchema(claim.error), "DATABASE_ERROR", 500)
  const owner: string | null = (claim.data as any)?.review_assigned_to ?? null
  assert(!owner || owner === admin.id || admin.role === "super_admin" || admin.role === "admin", "CLAIMED_BY_OTHER", 409, { owner })

  const now = new Date().toISOString()
  let note: string | null = null
  let reasonKey: string | null = null
  if (action === "reject") {
    const key = String(body.template_key || "")
    const template = (await loadReasons(db)).find((t) => t.key === key)
    assert(template, "REASON_TEMPLATE_REQUIRED", 422)
    note = buildReviewNote(template, body.message)
    reasonKey = template.key
  }
  const reviewStatus = action === "approve" ? "approved" : "rejected"
  const patch: Record<string, unknown> = { review_status: reviewStatus, review_note: note, reviewed_by: admin.id, reviewed_at: now, review_reason_key: reasonKey, updated_at: now }
  let upd: any = await db.from("hub_products").update(patch).eq("id", params.id).eq("review_status", "pending").select("id").maybeSingle()
  if (upd.error && isMissingSchema(upd.error)) {
    upd = await db.from("hub_products").update({ review_status: reviewStatus, review_note: note, updated_at: now }).eq("id", params.id).eq("review_status", "pending").select("id").maybeSingle()
  }
  check(upd.error)
  assert(upd.data, "LISTING_NOT_IN_REVIEW", 409)

  if (listing.merchant_id) {
    // alert the seller (in-app notice and email); a failure here never undoes the decision
    const n = await db.rpc("seller_notify", {
      p_merchant: listing.merchant_id, p_kind: "listing_review",
      p_payload: { status: reviewStatus, title: listing.title, note, productId: listing.id },
      p_dedupe: `listing_review:${listing.id}:${reviewStatus}:${now}`,
    })
    if (n.error && !isMissingSchema(n.error)) console.error("listing review alert failed", n.error.message)
  }
  await audit({
    actorKind: "admin", actorId: admin.id, actorRole: admin.role, merchantId: listing.merchant_id ?? null,
    action: `listing.${reviewStatus}`, entityType: "hub_product", entityId: listing.id, details: { title: listing.title, template_key: reasonKey, note },
  })
  return { review_status: reviewStatus, review_note: note }
})

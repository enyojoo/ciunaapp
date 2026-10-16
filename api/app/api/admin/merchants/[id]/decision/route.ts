import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { getMerchant, syncPublication } from "@/lib/merchant/service"
import { audit } from "@/lib/merchant/audit"

const ACTIONS = ["approve", "reject", "request_changes", "suspend", "reinstate"] as const
type Action = (typeof ACTIONS)[number]

export const POST = adminRoute("merchants.review", async (req, admin, params) => {
  const body = await readJson(req)
  const action = body.action as Action
  assert(ACTIONS.includes(action), "INVALID_ACTION")
  const reason = String(body.reason || "").trim().slice(0, 1000)
  const merchant = await getMerchant(params.id)
  const db = createServerClient()
  const now = new Date().toISOString()

  const openApp = async () => {
    const { data, error } = await db.from("merchant_applications").select("*").eq("merchant_id", merchant.id).in("status", ["submitted", "in_review"]).order("submitted_at", { ascending: false }).limit(1).maybeSingle()
    check(error)
    assert(data, "NO_OPEN_APPLICATION", 409)
    return data
  }

  let status = merchant.status
  if (action === "approve") {
    assert(merchant.status === "in_review", "MERCHANT_STATUS_NOT_ALLOWED", 409, { status: merchant.status })
    const app = await openApp()
    const tier = Number(app.answers?.tier) || 1
    const docs = await db.from("merchant_documents").select("status").eq("merchant_id", merchant.id)
    check(docs.error)
    assert((docs.data || []).length > 0 && (docs.data || []).every((d: any) => d.status === "approved"), "DOCUMENTS_NOT_APPROVED", 422)
    await db.from("merchant_applications").update({ status: "approved", reviewed_by: admin.id, reviewed_at: now, decision_reason: reason || null }).eq("id", app.id)
    const m = await db.from("merchants").update({ status: "live", kyb_tier: tier, approved_at: now, approved_by: admin.id, rejection_reason: null, updated_at: now }).eq("id", merchant.id).select("*").single()
    check(m.error)
    await syncPublication(m.data)
    // first-listing review state: approve everything submitted so far
    await db.from("hub_products").update({ review_status: "approved" }).eq("merchant_id", merchant.id).eq("review_status", "pending")
    status = "live"
  } else if (action === "reject" || action === "request_changes") {
    assert(merchant.status === "in_review", "MERCHANT_STATUS_NOT_ALLOWED", 409, { status: merchant.status })
    assert(reason.length >= 5, "REASON_REQUIRED", 422)
    const app = await openApp()
    await db.from("merchant_applications").update({ status: action === "reject" ? "rejected" : "changes_requested", reviewed_by: admin.id, reviewed_at: now, decision_reason: reason }).eq("id", app.id)
    const m = await db.from("merchants").update({ status: "rejected", rejection_reason: reason, updated_at: now }).eq("id", merchant.id).select("*").single()
    check(m.error)
    await syncPublication(m.data)
    status = "rejected"
  } else if (action === "suspend") {
    assert(["live", "paused"].includes(merchant.status), "MERCHANT_STATUS_NOT_ALLOWED", 409, { status: merchant.status })
    assert(reason.length >= 5, "REASON_REQUIRED", 422)
    const m = await db.from("merchants").update({ status: "suspended", rejection_reason: reason, updated_at: now }).eq("id", merchant.id).select("*").single()
    check(m.error)
    await syncPublication(m.data)
    status = "suspended"
  } else {
    assert(merchant.status === "suspended", "MERCHANT_STATUS_NOT_ALLOWED", 409, { status: merchant.status })
    const m = await db.from("merchants").update({ status: "paused", rejection_reason: null, updated_at: now }).eq("id", merchant.id).select("*").single()
    check(m.error)
    status = "paused"
  }
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, merchantId: merchant.id, action: `merchant.${action}`, entityType: "merchant", entityId: merchant.id, details: { reason: reason || null, status } })
  return { status }
})

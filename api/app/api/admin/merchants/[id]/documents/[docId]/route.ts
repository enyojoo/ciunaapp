import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const POST = adminRoute("merchants.review", async (req, admin, params) => {
  const body = await readJson(req)
  const status = String(body.status)
  assert(["approved", "rejected"].includes(status), "STATUS_INVALID")
  const reason = String(body.reason || "").trim().slice(0, 500)
  if (status === "rejected") assert(reason.length >= 3, "REASON_REQUIRED", 422)
  const { data, error } = await createServerClient()
    .from("merchant_documents")
    .update({ status, reason: reason || null, reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", params.docId)
    .eq("merchant_id", params.id)
    .select("id")
    .maybeSingle()
  check(error)
  assert(data, "DOCUMENT_NOT_FOUND", 404)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, merchantId: params.id, action: `document.${status}`, entityType: "merchant_document", entityId: params.docId, details: { reason: reason || null } })
  return { ok: true }
})

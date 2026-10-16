import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const POST = adminRoute("finance.manage", async (req, admin, params) => {
  const b = await readJson(req)
  const verified = b.verified !== false
  const { data, error } = await createServerClient().from("merchant_payout_methods").update({ verified }).eq("id", params.id).select("id,merchant_id").maybeSingle()
  check(error)
  assert(data, "PAYOUT_METHOD_NOT_FOUND", 404)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, merchantId: data.merchant_id, action: verified ? "payout_method.verified" : "payout_method.unverified", entityType: "merchant_payout_method", entityId: params.id })
  return { ok: true }
})

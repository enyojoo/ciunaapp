import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

/** Fees are snapshotted onto orders at acceptance, so deleting a rule never rewrites history. */
export const DELETE = adminRoute("fees.manage", async (_req, admin, params) => {
  const { error } = await createServerClient().from("fee_rules").delete().eq("id", params.id)
  check(error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "fee_rule.deleted", entityType: "fee_rule", entityId: params.id })
  return { ok: true }
})

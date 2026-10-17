import { adminRoute } from "@/lib/merchant/http"
import { assert } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { restoreDeletion } from "@/lib/account-deletion"

export const dynamic = "force-dynamic"

/** Put the account back before its date (the customer changed their mind, or it was a mistake). */
export const POST = adminRoute("users.manage", async (_req, admin, params) => {
  assert(/^[0-9a-f-]{36}$/i.test(params.userId || ""), "INVALID_REQUEST")
  const ok = await restoreDeletion(params.userId)
  assert(ok, "DELETION_NOT_PENDING", 409)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "account_deletion.restored", entityType: "user", entityId: params.userId })
  return { ok: true }
})

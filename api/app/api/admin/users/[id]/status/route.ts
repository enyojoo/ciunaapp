import { adminRoute, readJson } from "@/lib/merchant/http"
import { MerchantError } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/** Set a customer account's status (users.manage). */
export const PATCH = adminRoute("users.manage", async (req, admin, params) => {
  const { status } = await readJson(req)
  if (typeof status !== "string" || !status) throw new MerchantError("INVALID_REQUEST", 400)
  const { data, error } = await createServerClient()
    .from("users")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single()
  if (error) throw new MerchantError("UNAVAILABLE", 503)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "user.status_changed", entityType: "user", entityId: params.id, details: { status } })
  return { user: data }
})

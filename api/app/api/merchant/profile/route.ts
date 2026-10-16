import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { check, assert } from "@/lib/merchant/errors"
import { pickEditable, syncStorefrontFields } from "@/lib/merchant/service"
import { audit } from "@/lib/merchant/audit"
import type { MerchantRow } from "@/lib/merchant/auth"

export const GET = merchantRoute(null, async (_req, { merchant, role }) => ({ merchant, role }))

export const PATCH = merchantRoute("profile", async (req, { user, merchant }) => {
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  const patch = pickEditable(await readJson(req), merchant)
  assert(Object.keys(patch).length > 0, "NOTHING_TO_UPDATE")
  const { data, error } = await createServerClient()
    .from("merchants")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", merchant.id)
    .select("*")
    .single()
  check(error)
  await syncStorefrontFields(data as MerchantRow)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "merchant.profile_updated", entityType: "merchant", entityId: merchant.id, details: { fields: Object.keys(patch) } })
  return { merchant: data }
})

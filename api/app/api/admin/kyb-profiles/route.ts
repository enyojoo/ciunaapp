import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const GET = adminRoute("kyb.manage", async () => {
  const { data, error } = await createServerClient().from("kyb_profiles").select("*").order("country").order("tier")
  check(error)
  return { profiles: data || [] }
})

/** Create or update the requirements for a country/type/tier. Adding a country is a data change. */
export const PUT = adminRoute("kyb.manage", async (req, admin) => {
  const b = await readJson(req)
  const country = String(b.country || "").toUpperCase()
  assert(country === "*" || /^[A-Z]{2}$/.test(country), "COUNTRY_INVALID")
  assert(["store", "expert", "*"].includes(b.merchant_type), "TYPE_INVALID")
  assert([1, 2].includes(Number(b.tier)), "TIER_INVALID")
  const req2 = b.requirements
  assert(req2 && Array.isArray(req2.fields) && Array.isArray(req2.documents), "REQUIREMENTS_INVALID")
  const row = { country, merchant_type: b.merchant_type, tier: Number(b.tier), label: String(b.label || "").slice(0, 120) || `${country} tier ${b.tier}`, requirements: req2, sanctions_check: b.sanctions_check !== false, active: b.active !== false }
  const { data, error } = await createServerClient().from("kyb_profiles").upsert(row, { onConflict: "country,merchant_type,tier" }).select("*").single()
  check(error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "kyb_profile.saved", entityType: "kyb_profile", entityId: data.id, details: { country, tier: row.tier } })
  return { profile: data }
})

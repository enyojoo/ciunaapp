import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { cleanCredentials, cleanYears } from "@/lib/merchant/credentials"

export const dynamic = "force-dynamic"

async function profileFor(merchantId: string) {
  const { data, error } = await createServerClient().from("expert_profiles").select("id,credentials,years_experience").eq("merchant_id", merchantId).maybeSingle()
  check(error)
  assert(data, "EXPERT_ONLY", 409)
  return data as { id: string; credentials: unknown; years_experience: number | null }
}

export const GET = merchantRoute("profile", async (_req, { merchant }) => {
  const p = await profileFor(merchant.id)
  return { credentials: Array.isArray(p.credentials) ? p.credentials : [], yearsExperience: p.years_experience }
})

/** Replace the credentials list and years of experience: { credentials: [{ title, issuer?, year? }], yearsExperience? }. */
export const PUT = merchantRoute("profile", async (req, { user, merchant }) => {
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  const p = await profileFor(merchant.id)
  const b = await readJson(req)
  const patch: Record<string, unknown> = { credentials: cleanCredentials(b.credentials), updated_at: new Date().toISOString() }
  if ("yearsExperience" in b) patch.years_experience = cleanYears(b.yearsExperience)
  check((await createServerClient().from("expert_profiles").update(patch).eq("id", p.id)).error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert.credentials_updated", entityType: "expert_profile", entityId: p.id })
  return { ok: true }
})

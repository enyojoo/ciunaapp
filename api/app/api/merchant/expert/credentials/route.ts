import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { isMissingSchemaError } from "@/lib/safe-select"
import { audit } from "@/lib/merchant/audit"
import { cleanCredentials, cleanYears } from "@/lib/merchant/credentials"

export const dynamic = "force-dynamic"

async function profileFor(merchantId: string) {
  const db = createServerClient()
  let { data, error } = await db.from("expert_profiles").select("id,credentials,years_experience,credentials_review,credentials_review_reason").eq("merchant_id", merchantId).maybeSingle()
  // Before expert-credentials-review.sql runs, load without the review columns.
  if (error && isMissingSchemaError(error)) ({ data, error } = (await db.from("expert_profiles").select("id,credentials,years_experience").eq("merchant_id", merchantId).maybeSingle()) as never)
  check(error)
  assert(data, "EXPERT_ONLY", 409)
  return data as { id: string; credentials: unknown; years_experience: number | null; credentials_review?: string | null; credentials_review_reason?: string | null }
}

export const GET = merchantRoute("profile", async (_req, { merchant }) => {
  const p = await profileFor(merchant.id)
  const credentials = Array.isArray(p.credentials) ? p.credentials : []
  return { credentials, yearsExperience: p.years_experience, review: credentials.length === 0 ? "none" : p.credentials_review || "pending", reviewReason: p.credentials_review_reason ?? null }
})

/** Replace the credentials list and years of experience: { credentials: [{ title, issuer?, year? }], yearsExperience? }. */
export const PUT = merchantRoute("profile", async (req, { user, merchant }) => {
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  const p = await profileFor(merchant.id)
  const b = await readJson(req)
  // New text needs a new review: an earlier approval or rejection never covers it.
  const base: Record<string, unknown> = { credentials: cleanCredentials(b.credentials), updated_at: new Date().toISOString() }
  if ("yearsExperience" in b) base.years_experience = cleanYears(b.yearsExperience)
  const db = createServerClient()
  const reset = { credentials_review: null, credentials_review_reason: null, credentials_reviewed_by: null, credentials_reviewed_at: null }
  let { error } = await db.from("expert_profiles").update({ ...base, ...reset }).eq("id", p.id)
  // Before expert-credentials-review.sql runs the review columns do not exist: save without them.
  if (error && isMissingSchemaError(error)) ({ error } = await db.from("expert_profiles").update(base).eq("id", p.id))
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert.credentials_updated", entityType: "expert_profile", entityId: p.id })
  return { ok: true }
})

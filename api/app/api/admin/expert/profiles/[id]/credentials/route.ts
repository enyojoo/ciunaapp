import { adminRoute, readJson } from "@/lib/merchant/http"
import { MerchantError, assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const COLUMNS = "id,display_name,credentials,years_experience,credentials_review,credentials_review_reason,credentials_reviewed_at"

/** An expert's credentials and their review state (experts.manage). */
export const GET = adminRoute("experts.manage", async (_req, _admin, params) => {
  const { data, error } = await createServerClient().from("expert_profiles").select(COLUMNS).eq("id", params.id).maybeSingle()
  check(error)
  if (!data) throw new MerchantError("NOT_FOUND", 404)
  const list = Array.isArray(data.credentials) ? data.credentials : []
  return {
    credentials: list,
    yearsExperience: data.years_experience,
    review: list.length === 0 ? "none" : data.credentials_review || "pending",
    reason: data.credentials_review_reason,
    reviewedAt: data.credentials_reviewed_at,
  }
})

/** Approve or reject the credentials as they stand. Body: { decision: "approved" | "rejected", reason? }. A rejection needs a reason. */
export const POST = adminRoute("experts.manage", async (req, admin, params) => {
  const body = await readJson(req)
  const decision = String(body.decision || "")
  assert(decision === "approved" || decision === "rejected", "INVALID_REQUEST", 400)
  const reason = String(body.reason || "").trim().slice(0, 500)
  assert(decision === "approved" || reason.length > 0, "REASON_REQUIRED", 400)
  const db = createServerClient()
  const { data, error } = await db.from("expert_profiles").select("id,credentials").eq("id", params.id).maybeSingle()
  check(error)
  if (!data) throw new MerchantError("NOT_FOUND", 404)
  assert(Array.isArray(data.credentials) && data.credentials.length > 0, "NO_CREDENTIALS", 409)
  check(
    (
      await db
        .from("expert_profiles")
        .update({ credentials_review: decision, credentials_review_reason: decision === "rejected" ? reason : null, credentials_reviewed_by: admin.id, credentials_reviewed_at: new Date().toISOString() })
        .eq("id", params.id)
    ).error,
  )
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: `expert.credentials_${decision}`, entityType: "expert_profile", entityId: params.id, details: reason ? { reason } : {} })
  return { ok: true }
})

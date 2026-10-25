import { adminRoute, readJson } from "@/lib/merchant/http"
import { MerchantError } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { kycService } from "@/lib/kyc-service"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/** KYC submissions with Bitbanker compliance references (users.read). */
export const GET = adminRoute("users.read", async (req) => {
  const status = req.nextUrl.searchParams.get("status")
  const submissions = await kycService.getAllSubmissions(status || undefined)
  const { data: bitbanker, error } = await createServerClient()
    .from("bitbanker_client_refs")
    .select("user_id, client_id, environment, is_verified_for_sbp, last_form_snapshot, last_form_submitted_at, updated_at")
  if (error) console.error("Error fetching Bitbanker compliance refs:", error)
  return { submissions, bitbanker: bitbanker ?? [] }
})

/** Review a KYC submission (users.manage: compliance, ops, super admin). */
export const PATCH = adminRoute("users.manage", async (req, admin) => {
  const { submissionId, status, rejectionReason } = await readJson(req)
  if (!submissionId || !status || !["in_review", "approved", "rejected"].includes(status)) throw new MerchantError("INVALID_REQUEST", 400)
  const submission = await kycService.updateStatus(submissionId, status, admin.id, rejectionReason)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "kyc.reviewed", entityType: "kyc_submission", entityId: String(submissionId), details: { status } })
  return { submission }
})

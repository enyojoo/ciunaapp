import { adminRoute, readJson } from "@/lib/merchant/http"
import { MerchantError, assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { REFUNDABLE } from "@/lib/transaction-transitions"
import { rollbackReferralRewardsForTransaction } from "@/lib/referral-reward-service"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/**
 * Record a refund: the transaction becomes `refunded` and any referral reward it earned is taken back. Body: { reason }.
 * Needs finance.manage. This records the decision; the money goes back through the payment provider.
 */
export const POST = adminRoute("finance.manage", async (req, admin, params) => {
  const reason = String((await readJson(req)).reason || "").trim().slice(0, 500)
  assert(reason.length > 0, "REASON_REQUIRED", 400)
  const db = createServerClient()
  const { data, error } = await db.from("transactions").select("*").eq("transaction_id", params.id).maybeSingle()
  check(error)
  if (!data) throw new MerchantError("NOT_FOUND", 404)
  assert((REFUNDABLE as readonly string[]).includes(data.status), "INVALID_TRANSITION", 409, { status: data.status })
  const { error: upd } = await db
    .from("transactions")
    .update({ status: "refunded", failure_reason: reason, updated_at: new Date().toISOString() })
    .eq("transaction_id", params.id)
    .eq("status", data.status)
  check(upd)
  if (data.status === "completed") await rollbackReferralRewardsForTransaction(data as never)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "transaction.refunded", entityType: "transaction", entityId: params.id, details: { from: data.status, reason } })
  return { ok: true, status: "refunded" }
})

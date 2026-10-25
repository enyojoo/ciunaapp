import { adminRoute, readJson } from "@/lib/merchant/http"
import { MerchantError, assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { RETRYABLE } from "@/lib/transaction-transitions"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/** Put a failed transaction back to processing so it is picked up again. Body: { reason }. Needs transactions.manage. */
export const POST = adminRoute("transactions.manage", async (req, admin, params) => {
  const reason = String((await readJson(req)).reason || "").trim().slice(0, 500)
  assert(reason.length > 0, "REASON_REQUIRED", 400)
  const db = createServerClient()
  const { data, error } = await db.from("transactions").select("transaction_id,status").eq("transaction_id", params.id).maybeSingle()
  check(error)
  if (!data) throw new MerchantError("NOT_FOUND", 404)
  assert((RETRYABLE as readonly string[]).includes(data.status), "INVALID_TRANSITION", 409, { status: data.status })
  check((await db.from("transactions").update({ status: "processing", failure_reason: null, updated_at: new Date().toISOString() }).eq("transaction_id", params.id).eq("status", data.status)).error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "transaction.retried", entityType: "transaction", entityId: params.id, details: { from: data.status, reason } })
  return { ok: true, status: "processing" }
})

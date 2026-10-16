import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { decryptDetails } from "@/lib/merchant/payout-crypto"
import { moneyError } from "@/lib/merchant/money"
import { audit } from "@/lib/merchant/audit"

/** Full destination details, decrypted only for finance, and every reveal is audited. */
export const GET = adminRoute("finance.manage", async (_req, admin, params) => {
  const db = createServerClient()
  const { data: p, error } = await db.from("payouts").select("*, merchant_payout_methods(details_encrypted, verified, kind), merchants(display_name,country)").eq("id", params.id).maybeSingle()
  check(error)
  assert(p, "PAYOUT_NOT_FOUND", 404)
  let details: Record<string, string> | null = null
  const enc = (p as any).merchant_payout_methods?.details_encrypted
  if (enc) {
    try { details = decryptDetails(enc, p.merchant_id) } catch { details = null }
  }
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, merchantId: p.merchant_id, action: "payout.details_revealed", entityType: "payout", entityId: p.id })
  const { merchant_payout_methods, ...rest } = p as any
  return { payout: rest, verified: merchant_payout_methods?.verified ?? false, kind: merchant_payout_methods?.kind, details }
})

export const POST = adminRoute("finance.manage", async (req, admin, params) => {
  const b = await readJson(req)
  assert(["approve", "paid", "reject"].includes(b.action), "INVALID_ACTION")
  const { error } = await createServerClient().rpc("payout_decide", { p_payout: params.id, p_action: b.action, p_actor: admin.id, p_reference: b.reference ?? null, p_reason: b.reason ?? null })
  if (error) moneyError(error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: `payout.${b.action}`, entityType: "payout", entityId: params.id, details: { reference: b.reference ?? null, reason: b.reason ?? null } })
  return { ok: true }
})

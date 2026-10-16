import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { moneyError } from "@/lib/merchant/money"
import { audit } from "@/lib/merchant/audit"

export const POST = merchantRoute("payouts", async (_req, { user, merchant }, params) => {
  const db = createServerClient()
  const p = await db.from("payouts").select("id").eq("id", params.id).eq("merchant_id", merchant.id).maybeSingle()
  check(p.error)
  assert(p.data, "PAYOUT_NOT_FOUND", 404)
  const { error } = await db.rpc("payout_decide", { p_payout: params.id, p_action: "cancel", p_actor: user.id })
  if (error) moneyError(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "payout.cancelled", entityType: "payout", entityId: params.id })
  return { ok: true }
})

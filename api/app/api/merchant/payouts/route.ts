import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { loadFeeRules, moneyError, setting } from "@/lib/merchant/money"
import { resolveFee } from "@/lib/merchant/fees"
import { audit } from "@/lib/merchant/audit"

export const GET = merchantRoute("payouts", async (_req, { merchant }) => {
  const { data, error } = await createServerClient().from("payouts").select("id,currency,amount,fee,net,status,reference,reason,method_snapshot,requested_at,decided_at,paid_at").eq("merchant_id", merchant.id).order("requested_at", { ascending: false }).limit(100)
  check(error)
  return { payouts: data || [] }
})

/** ?quote=1 style preview is the same call with `preview: true`: returns the fee without moving money. */
export const POST = merchantRoute("payouts", async (req, { user, merchant }) => {
  assert(["live", "paused"].includes(merchant.status), "MERCHANT_STATUS_NOT_ALLOWED", 409, { status: merchant.status })
  const body = await readJson(req)
  const amount = Math.round(Number(body.amount) * 100) / 100
  const currency = String(body.currency || "").toUpperCase()
  assert(Number.isFinite(amount) && amount > 0 && /^[A-Z]{3}$/.test(currency), "AMOUNT_INVALID")
  const rules = await loadFeeRules("payout")
  const fee = resolveFee(rules, null, { kind: "payout", merchantId: merchant.id, currency }, amount).fee
  const min = (await setting<Record<string, number>>("min_payout", {}))[currency] ?? 0
  if (body.preview) return { fee, net: Math.round((amount - fee) * 100) / 100, min }
  const { data, error } = await createServerClient().rpc("payout_request", { p_merchant: merchant.id, p_method: body.methodId, p_amount: amount, p_currency: currency, p_user: user.id, p_min: min, p_fee: fee })
  if (error) moneyError(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "payout.requested", entityType: "payout", entityId: data as string, details: { amount, currency, fee } })
  return { id: data, fee, net: Math.round((amount - fee) * 100) / 100 }
})

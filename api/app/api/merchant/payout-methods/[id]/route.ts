import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

export const PATCH = merchantRoute("payouts", async (_req, { user, merchant }, params) => {
  const db = createServerClient()
  const m = await db.from("merchant_payout_methods").select("id").eq("id", params.id).eq("merchant_id", merchant.id).maybeSingle()
  check(m.error)
  assert(m.data, "PAYOUT_METHOD_NOT_FOUND", 404)
  await db.from("merchant_payout_methods").update({ is_default: false }).eq("merchant_id", merchant.id)
  const { error } = await db.from("merchant_payout_methods").update({ is_default: true }).eq("id", params.id)
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "payout_method.default", entityType: "merchant_payout_method", entityId: params.id })
  return { ok: true }
})

export const DELETE = merchantRoute("payouts", async (_req, { user, merchant }, params) => {
  const db = createServerClient()
  const open = await db.from("payouts").select("id", { count: "exact", head: true }).eq("method_id", params.id).in("status", ["requested", "approved"])
  assert((open.count ?? 0) === 0, "METHOD_IN_USE", 409)
  const { data, error } = await db.from("merchant_payout_methods").delete().eq("id", params.id).eq("merchant_id", merchant.id).select("id")
  // historical payouts keep a snapshot; a method referenced by a past payout can't be deleted (FK) and is reported clearly
  if (error?.code === "23503") assert(false, "METHOD_HAS_HISTORY", 409)
  check(error)
  assert(data?.length, "PAYOUT_METHOD_NOT_FOUND", 404)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "payout_method.removed", entityType: "merchant_payout_method", entityId: params.id })
  return { ok: true }
})

import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { encryptDetails, validateDetails, lastFour } from "@/lib/merchant/payout-crypto"
import { audit } from "@/lib/merchant/audit"

const PUBLIC = "id,kind,currency,label,last4,verified,is_default,created_at"

export const GET = merchantRoute("payouts", async (_req, { merchant }) => {
  const { data, error } = await createServerClient().from("merchant_payout_methods").select(PUBLIC).eq("merchant_id", merchant.id).order("created_at")
  check(error)
  return { methods: data || [] }
})

/** Details are encrypted at rest and never returned. Office verifies a method before it can receive money. */
export const POST = merchantRoute("payouts", async (req, { user, merchant }) => {
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  const body = await readJson(req)
  const kind = String(body.kind || "")
  const currency = String(body.currency || "").toUpperCase()
  assert(/^[A-Z]{3}$/.test(currency), "CURRENCY_INVALID")
  const details = validateDetails(kind, currency, body.details || {})
  if (typeof details === "string") {
    const [code, field] = details.split(":")
    assert(false, code, 400, field ? { field } : undefined)
  }
  const db = createServerClient()
  const count = await db.from("merchant_payout_methods").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id)
  assert((count.count ?? 0) < 10, "TOO_MANY_METHODS", 409)
  const first = (count.count ?? 0) === 0
  const label = String(body.label || "").trim().slice(0, 60) || `${kind.toUpperCase()} ${currency}`
  const { data, error } = await db.from("merchant_payout_methods").insert({
    merchant_id: merchant.id, kind, currency, label, details_encrypted: encryptDetails(details as Record<string, string>, merchant.id),
    last4: lastFour(kind, details as Record<string, string>), is_default: first,
  }).select(PUBLIC).single()
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "payout_method.added", entityType: "merchant_payout_method", entityId: data!.id, details: { kind, currency } })
  return { method: data }
})

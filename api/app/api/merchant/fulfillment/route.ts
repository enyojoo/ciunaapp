import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"

const CURRENCY = /^[A-Z]{3}$/

async function vendorFor(merchantId: string) {
  const { data, error } = await createServerClient().from("hub_vendors").select("id,pickup_location,pickup_hours,fulfillment_notes").eq("merchant_id", merchantId).maybeSingle()
  check(error)
  assert(data, "STORE_ONLY", 409)
  return data
}

export const GET = merchantRoute("catalog", async (_req, { merchant }) => {
  const vendor = await vendorFor(merchant.id)
  const { data, error } = await createServerClient().from("marketplace_zones").select("id,city,district,fee,currency,active").eq("vendor_id", vendor.id).order("city").order("district")
  check(error)
  return { pickup: { location: vendor.pickup_location, hours: vendor.pickup_hours }, notes: vendor.fulfillment_notes, zones: data || [] }
})

/** Replace pickup details and delivery zones in one save. */
export const PUT = merchantRoute("catalog", async (req, { user, merchant }) => {
  const vendor = await vendorFor(merchant.id)
  const body = await readJson(req)
  const zones: any[] = Array.isArray(body.zones) ? body.zones : []
  assert(zones.length <= 200, "TOO_MANY_ZONES")
  const clean = zones.map((z) => {
    const city = String(z.city || "").trim().slice(0, 80)
    const district = String(z.district || "").trim().slice(0, 80)
    const fee = Number(z.fee)
    const currency = String(z.currency || "").toUpperCase()
    assert(city && district, "ZONE_INVALID")
    assert(Number.isFinite(fee) && fee >= 0 && fee < 1e7, "ZONE_FEE_INVALID")
    assert(CURRENCY.test(currency), "ZONE_CURRENCY_INVALID")
    return { vendor_id: vendor.id, city, district, fee, currency, active: z.active !== false, updated_at: new Date().toISOString() }
  })
  assert(new Set(clean.map((z) => `${z.city}|${z.district}`)).size === clean.length, "ZONE_DUPLICATE")
  const db = createServerClient()
  const upd = await db.from("hub_vendors").update({
    pickup_location: body.pickup?.location ? String(body.pickup.location).trim().slice(0, 300) : null,
    pickup_hours: body.pickup?.hours ? String(body.pickup.hours).trim().slice(0, 200) : null,
    fulfillment_notes: body.notes ? String(body.notes).trim().slice(0, 1000) : null,
    updated_at: new Date().toISOString(),
  }).eq("id", vendor.id)
  check(upd.error)
  if (clean.length) {
    const up = await db.from("marketplace_zones").upsert(clean, { onConflict: "vendor_id,city,district" })
    check(up.error)
  }
  // zones no longer listed are deactivated (kept for historical orders, which hold their own snapshot)
  const keep = new Set(clean.map((z) => `${z.city}|${z.district}`))
  const existing = await db.from("marketplace_zones").select("id,city,district").eq("vendor_id", vendor.id)
  check(existing.error)
  const stale = (existing.data || []).filter((z: any) => !keep.has(`${z.city}|${z.district}`)).map((z: any) => z.id)
  if (stale.length) check((await db.from("marketplace_zones").update({ active: false }).in("id", stale)).error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "fulfillment.updated", entityType: "hub_vendor", entityId: vendor.id, details: { zones: clean.length } })
  return { ok: true }
})

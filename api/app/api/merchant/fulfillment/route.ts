import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { safeSelect } from "@/lib/safe-select"
import { assert, check } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { normalizeSchedule } from "@/lib/merchant/hours"

const CURRENCY = /^[A-Z]{3}$/
const VENDOR_COLUMNS = "id, pickup_location, pickup_hours, fulfillment_notes, opening_hours, min_order_amount, min_order_currency, is_paused"
const ZONE_COLUMNS = "id, city, district, fee, currency, active, eta_minutes"

async function vendorFor(merchantId: string) {
  const { data, error } = await safeSelect("hub_vendors", VENDOR_COLUMNS, (cols) =>
    createServerClient().from("hub_vendors").select(cols).eq("merchant_id", merchantId).maybeSingle(),
  )
  check(error)
  assert(data, "STORE_ONLY", 409)
  return data as unknown as Record<string, any>
}

export const GET = merchantRoute("catalog", async (_req, { merchant }) => {
  const vendor = await vendorFor(merchant.id)
  const { data, error } = await safeSelect("marketplace_zones", ZONE_COLUMNS, (cols) =>
    createServerClient().from("marketplace_zones").select(cols).eq("vendor_id", vendor.id).order("city").order("district"),
  )
  check(error)
  return {
    pickup: { location: vendor.pickup_location, hours: vendor.pickup_hours },
    notes: vendor.fulfillment_notes,
    hours: vendor.opening_hours || {},
    paused: vendor.is_paused === true,
    timeZone: merchant.time_zone || "UTC",
    minOrder: vendor.min_order_amount != null ? { amount: Number(vendor.min_order_amount), currency: vendor.min_order_currency } : null,
    zones: data || [],
  }
})

/** Replace pickup details, opening hours, minimum order and delivery zones in one save. */
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
    const row: Record<string, unknown> = { vendor_id: vendor.id, city, district, fee, currency, active: z.active !== false, updated_at: new Date().toISOString() }
    // Only written when sent, so a client that does not know about ETAs never clears them.
    if ("etaMinutes" in z) {
      const eta = z.etaMinutes == null || z.etaMinutes === "" ? null : Number(z.etaMinutes)
      assert(eta == null || (Number.isInteger(eta) && eta >= 1 && eta <= 1440), "ZONE_ETA_INVALID")
      row.eta_minutes = eta
    }
    return row
  })
  assert(new Set(clean.map((z) => `${z.city}|${z.district}`)).size === clean.length, "ZONE_DUPLICATE")

  const patch: Record<string, unknown> = {
    pickup_location: body.pickup?.location ? String(body.pickup.location).trim().slice(0, 300) : null,
    pickup_hours: body.pickup?.hours ? String(body.pickup.hours).trim().slice(0, 200) : null,
    fulfillment_notes: body.notes ? String(body.notes).trim().slice(0, 1000) : null,
    updated_at: new Date().toISOString(),
  }
  if ("hours" in body) patch.opening_hours = normalizeSchedule(body.hours)
  if (typeof body.paused === "boolean") patch.is_paused = body.paused
  if ("minOrder" in body) {
    const m = body.minOrder
    if (m == null || m.amount == null || m.amount === "") {
      patch.min_order_amount = null
      patch.min_order_currency = null
    } else {
      const amount = Number(m.amount)
      const currency = String(m.currency || "").toUpperCase()
      assert(Number.isFinite(amount) && amount >= 0 && amount < 1e7, "MIN_ORDER_INVALID")
      assert(CURRENCY.test(currency), "MIN_ORDER_CURRENCY_INVALID")
      patch.min_order_amount = amount
      patch.min_order_currency = currency
    }
  }
  const db = createServerClient()
  const upd = await db.from("hub_vendors").update(patch).eq("id", vendor.id)
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
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "fulfillment.updated", entityType: "hub_vendor", entityId: vendor.id, details: { zones: clean.length, ...(typeof body.paused === "boolean" ? { paused: body.paused } : {}) } })
  return { ok: true }
})

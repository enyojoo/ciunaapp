import assert from "node:assert/strict"
import { test } from "node:test"
import { summarizeZones } from "../../lib/delivery-info"

test("a store shows its cheapest fee and the range of delivery times", () => {
  const m = summarizeZones([
    { vendor_id: "v1", city: "Moscow", district: "Arbat", fee: 150, currency: "RUB", active: true, eta_minutes: 45 },
    { vendor_id: "v1", fee: 100, currency: "RUB", active: true, eta_minutes: 30 },
    { vendor_id: "v1", fee: 90, currency: "USD", active: true, eta_minutes: 90 },
    { vendor_id: "v1", fee: 50, currency: "RUB", active: false, eta_minutes: 10 },
  ])
  assert.deepEqual(m.get("v1"), { delivery_zone_count: 3, delivery_fee_from: 100, delivery_fee_currency: "RUB", delivery_eta_min: 30, delivery_eta_max: 90, delivery_areas: [{ city: "Moscow", district: "Arbat" }] })
})

test("zones without times or fees leave those blank; a store with no zones is absent (pickup only)", () => {
  const m = summarizeZones([{ vendor_id: "v2", fee: null, currency: "RUB", active: true }])
  assert.deepEqual(m.get("v2"), { delivery_zone_count: 1, delivery_fee_from: null, delivery_fee_currency: null, delivery_eta_min: null, delivery_eta_max: null, delivery_areas: [] })
  assert.equal(m.has("v3"), false)
})

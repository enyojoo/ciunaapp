import test from "node:test"
import assert from "node:assert/strict"
import { areaMatches, vendorServesCity, vendorServesCommunity } from "../src/hub/filters"

test("community filter: none chosen keeps every store, a choice keeps only matching stores", () => {
  assert.equal(vendorServesCommunity({ communities: [] }, null), true)
  assert.equal(vendorServesCommunity({ communities: ["nigerian"] }, "nigerian"), true)
  assert.equal(vendorServesCommunity({ communities: ["chinese"] }, "nigerian"), false)
  assert.equal(vendorServesCommunity({}, "nigerian"), false)
  assert.equal(vendorServesCommunity({ communities: null }, "nigerian"), false)
})

test("city filter: delivery areas decide, pickup-only and digital stores always show", () => {
  const moscow = { delivery_areas: [{ city: "Moscow", district: "Center" }], delivery_zone_count: 1 }
  assert.equal(vendorServesCity(moscow, null), true)
  assert.equal(vendorServesCity(moscow, "Moscow"), true)
  assert.equal(vendorServesCity(moscow, "Москва"), true)
  assert.equal(vendorServesCity(moscow, "Kazan"), false)
  assert.equal(vendorServesCity({ delivery_areas: [], delivery_zone_count: 0 }, "Kazan"), true)
  assert.equal(vendorServesCity({}, "Kazan"), true)
  assert.equal(vendorServesCity({ delivery_areas: [], delivery_zone_count: 3 }, "Kazan"), false)
})

test("expert area filter: empty area and online always show; named areas must include the city", () => {
  assert.equal(areaMatches(null, "Moscow"), true)
  assert.equal(areaMatches("", "Moscow"), true)
  assert.equal(areaMatches("Anywhere", null), true)
  assert.equal(areaMatches("Moscow and Moscow region", "Moscow"), true)
  assert.equal(areaMatches("Москва", "Moscow"), true)
  assert.equal(areaMatches("Saint Petersburg", "Moscow"), false)
})

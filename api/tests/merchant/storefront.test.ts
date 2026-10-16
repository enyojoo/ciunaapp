import assert from "node:assert/strict"
import { test } from "node:test"
import { expertFields, storefrontFields } from "../../lib/merchant/storefront"

test("a store with no hours is never shown as closed", () => {
  const f = storefrontFields({ opening_hours: {}, time_zone: "UTC" })
  assert.equal(f.hours_configured, false)
  assert.equal(f.is_open, true)
})

test("a store with hours reports open state, next opening and its zone", () => {
  const row = { opening_hours: { mon: [{ open: "09:00", close: "21:00" }] }, time_zone: "Europe/Moscow" }
  const open = storefrontFields(row, new Date("2026-10-19T07:30:00Z")) // Monday 10:30 Moscow
  assert.equal(open.is_open, true)
  assert.equal(open.closes_at, "21:00")
  const closed = storefrontFields(row, new Date("2026-10-19T19:00:00Z")) // Monday 22:00 Moscow
  assert.equal(closed.is_open, false)
  assert.deepEqual(closed.opens_at, { day: "mon", time: "09:00" })
  assert.equal(closed.time_zone, "Europe/Moscow")
})

test("minimum order, cover and tier come through; tier falls back to the verified flag", () => {
  const f = storefrontFields({ min_order_amount: "500.00", min_order_currency: "RUB", cover_url: "https://x/c.jpg", is_verified: true })
  assert.equal(f.min_order_amount, 500)
  assert.equal(f.min_order_currency, "RUB")
  assert.equal(f.cover_url, "https://x/c.jpg")
  assert.equal(f.verification_tier, 1)
  assert.equal(storefrontFields({}).min_order_amount, null)
})

test("expert fields are cleaned and capped", () => {
  const f = expertFields({
    languages: ["en", "ru"],
    time_zone: "Africa/Lagos",
    credentials: [{ title: "  MSc Nutrition ", issuer: "UCL", year: 2019 }, { title: "" }, { nope: true }],
    years_experience: 7,
    is_verified: true,
    verification_tier: 2,
  })
  assert.deepEqual(f.languages, ["en", "ru"])
  assert.equal(f.time_zone, "Africa/Lagos")
  assert.deepEqual(f.credentials, [{ title: "MSc Nutrition", issuer: "UCL", year: 2019 }])
  assert.equal(f.years_experience, 7)
  assert.equal(f.verification_tier, 2)
  assert.deepEqual(expertFields({}).languages, [])
  assert.equal(expertFields({}).time_zone, "UTC")
})

import { storeClosedState } from "../../lib/merchant/storefront"

test("closed state blocks only stores that set hours and are closed now", () => {
  const row = { opening_hours: { mon: [{ open: "09:00", close: "21:00" }] }, time_zone: "Europe/Moscow" }
  assert.equal(storeClosedState(row, new Date("2026-10-19T07:30:00Z")), undefined) // Monday 10:30, open
  assert.deepEqual(storeClosedState(row, new Date("2026-10-19T19:00:00Z")), { opensAt: { day: "mon", time: "09:00" } }) // Monday 22:00
  assert.equal(storeClosedState({ opening_hours: {} }), undefined) // no hours set: never closed
  assert.equal(storeClosedState(null), undefined)
})

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

test("a paused store is closed to orders whatever its hours say, even with no hours", () => {
  const open = { opening_hours: { mon: [{ open: "09:00", close: "18:00" }] }, time_zone: "UTC" }
  const monday = new Date("2026-10-19T10:00:00Z")
  assert.equal(storeClosedState(open, monday), undefined)
  assert.deepEqual(storeClosedState({ ...open, is_paused: true }, monday), { paused: true })
  assert.deepEqual(storeClosedState({ opening_hours: {}, is_paused: true }), { paused: true })
  const f = storefrontFields({ ...open, is_paused: true }, monday)
  assert.equal(f.is_open, false)
  assert.equal(f.is_paused, true)
  assert.equal(f.opens_at, null)
})

import { fromPrice, nextAvailable } from "../../lib/expert-availability"

test("an expert's from-price is the cheapest hourly rate, then fixed, then a custom quote", () => {
  assert.deepEqual(fromPrice([{ pricing_type: "hourly", hourly_rate: 50, hourly_currency: "usd" }, { pricing_type: "hourly", hourly_rate: 30, hourly_currency: "USD" }, { pricing_type: "fixed", fixed_amount: 5, fixed_currency: "USD" }]), { amount: 30, currency: "USD", per: "hour" })
  assert.deepEqual(fromPrice([{ pricing_type: "fixed", fixed_amount: 90, fixed_currency: "RUB" }, { pricing_type: "fixed", fixed_amount: 70, fixed_currency: "RUB" }]), { amount: 70, currency: "RUB", per: null })
  assert.deepEqual(fromPrice([{ pricing_type: "quote" }]), { quote: true })
  assert.equal(fromPrice([]), null)
})

test("next available skips slots inside the booking lead time and picks the earliest per expert", () => {
  const now = Date.parse("2026-10-19T10:00:00Z")
  const services = [{ id: "s1", expert_profile_id: "e1", booking_lead_minutes: 120 }, { id: "s2", expert_profile_id: "e1", booking_lead_minutes: 60 }, { id: "s3", expert_profile_id: "e2" }]
  const slots = [
    { expert_service_id: "s1", slot_start: "2026-10-19T11:00:00Z" }, // inside 2h lead
    { expert_service_id: "s1", slot_start: "2026-10-19T14:00:00Z" },
    { expert_service_id: "s2", slot_start: "2026-10-19T11:30:00Z" }, // ok (1h lead)
    { expert_service_id: "s3", slot_start: "2026-10-19T11:59:00Z" }, // inside default 2h lead
    { expert_service_id: "nope", slot_start: "2026-10-19T15:00:00Z" },
  ]
  const r = nextAvailable(slots, services, now)
  assert.equal(r.get("e1"), "2026-10-19T11:30:00.000Z")
  assert.equal(r.has("e2"), false)
})

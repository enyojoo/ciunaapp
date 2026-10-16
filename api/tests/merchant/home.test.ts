import assert from "node:assert/strict"
import { test } from "node:test"
import { expiringDocuments, feeRuleOf, lowStock, ordersDelta, rejectReasonOf, reversalReasonOf, startOfDayInZone, sumEarnings, zoneOffsetMinutes } from "../../lib/merchant/home"

test("start of day follows the business zone, not UTC", () => {
  const now = new Date("2026-10-20T22:30:00Z") // 01:30 on the 21st in Moscow (UTC+3), 23:30 on the 20th in Lagos (UTC+1)
  assert.equal(startOfDayInZone(now, "Europe/Moscow").toISOString(), "2026-10-20T21:00:00.000Z")
  assert.equal(startOfDayInZone(now, "Africa/Lagos").toISOString(), "2026-10-19T23:00:00.000Z")
  assert.equal(zoneOffsetMinutes("Europe/Moscow", now), 180)
})

test("today's earnings: gross is items plus delivery, reversed rows are excluded, one currency", () => {
  const rows = [
    { currency: "RUB", subtotal: 1100, delivery_fee: 150, commission: 88, net: 1162, status: "available" },
    { currency: "RUB", subtotal: 900, delivery_fee: 0, commission: 72, net: 828, status: "pending" },
    { currency: "RUB", subtotal: 700, delivery_fee: 0, commission: 56, net: 644, status: "reversed" },
    { currency: "USD", subtotal: 10, delivery_fee: 0, commission: 1, net: 9, status: "pending" },
  ]
  assert.deepEqual(sumEarnings(rows, "RUB"), { orders: 2, gross: 2150, fee: 160, net: 1990, currency: "RUB" })
  assert.equal(sumEarnings(rows, "EUR"), null)
  assert.equal(sumEarnings([], "RUB"), null)
})

test("low stock: live, tracked, not sold out, at or below the threshold, lowest first", () => {
  const p = [
    { id: "a", stock_quantity: 2, sold_out: false },
    { id: "b", stock_quantity: null, sold_out: false },
    { id: "c", stock_quantity: 0, sold_out: true },
    { id: "d", stock_quantity: 3, sold_out: false },
    { id: "e", stock_quantity: 9, sold_out: false },
    { id: "f", stock_quantity: 1, sold_out: false },
  ]
  assert.deepEqual(lowStock(p, 3).map((x) => x.id), ["f", "a", "d"])
})

test("documents expiring within the window, including ones already expired, earliest first", () => {
  const now = new Date("2026-10-16T09:00:00Z")
  const docs = [
    { expires_at: "2027-03-01", status: "approved" },
    { expires_at: "2026-11-10", status: "approved" },
    { expires_at: "2026-10-01", status: "approved" },
    { expires_at: "2026-10-20", status: "rejected" },
    { expires_at: null, status: "approved" },
  ]
  assert.deepEqual(expiringDocuments(docs, now, 30).map((d) => d.expires_at), ["2026-10-01", "2026-11-10"])
})

test("fee rule comes from the frozen snapshot", () => {
  assert.deepEqual(feeRuleOf({ source: "service_line", percent: 8, fixed: null, currency: "RUB" }, "food"), { line: "food", source: "service_line", percent: 8, fixed: null, currency: "RUB" })
  assert.equal(feeRuleOf({ source: "none" }, "food"), null)
  assert.equal(feeRuleOf(null, "food"), null)
  assert.equal(feeRuleOf({ source: "platform", percent: null, fixed: null }, "mart"), null)
})

test("reject reason drops the internal prefix; reversal memo hides the default wording", () => {
  assert.equal(rejectReasonOf({ reason: "Rejected by seller: Out of stock today." }), "Out of stock today.")
  assert.equal(rejectReasonOf({ reason: "plain" }), "plain")
  assert.equal(rejectReasonOf({}), null)
  assert.equal(reversalReasonOf("Refund after fulfilment"), null)
  assert.equal(reversalReasonOf("Customer disputed the delivery"), "Customer disputed the delivery")
  assert.equal(reversalReasonOf(null), null)
})

test("orders delta is omitted when equal", () => {
  assert.equal(ordersDelta(3, 3), null)
  assert.deepEqual(ordersDelta(5, 3), { direction: "up", amount: 2 })
  assert.deepEqual(ordersDelta(1, 4), { direction: "down", amount: 3 })
})

import assert from "node:assert/strict"
import { test } from "node:test"
import { evaluateTransfer, inReview, levelFor, monthWindow, normalizeLimit } from "../../lib/limits"

const L2 = normalizeLimit({ level: 2, currency: "RUB", monthly_amount: "600000.00", min_per_transfer: "1000.00", max_per_transfer: "300000.00" })

test("level follows approved verifications only", () => {
  assert.equal(levelFor([]), 1)
  assert.equal(levelFor([{ type: "identity", status: "in_review" }]), 1)
  assert.equal(levelFor([{ type: "identity", status: "rejected" }]), 1)
  assert.equal(levelFor([{ type: "identity", status: "approved" }]), 2)
  assert.equal(levelFor([{ type: "address", status: "approved" }]), 1) // address alone does not raise the level
  assert.equal(levelFor([{ type: "identity", status: "approved" }, { type: "address", status: "approved" }]), 3)
})

test("a verification waiting for a decision is reported as in review", () => {
  assert.equal(inReview([{ type: "identity", status: "in_review" }]), true)
  assert.equal(inReview([{ type: "identity", status: "approved" }]), false)
})

test("the month is the UTC calendar month and resets on the 1st", () => {
  const w = monthWindow(new Date("2026-10-17T23:30:00Z"))
  assert.equal(w.start.toISOString(), "2026-10-01T00:00:00.000Z")
  assert.equal(w.resetsAt.toISOString(), "2026-11-01T00:00:00.000Z")
  assert.equal(monthWindow(new Date("2026-12-31T23:59:59Z")).resetsAt.toISOString(), "2027-01-01T00:00:00.000Z")
})

test("no configured limit means no limit", () => {
  assert.equal(evaluateTransfer(undefined, 0, 1e9, "RUB"), null)
})

test("a transfer is checked against minimum, maximum and what is left this month", () => {
  assert.equal(evaluateTransfer(L2, 0, 5000, "RUB"), null)
  assert.deepEqual(evaluateTransfer(L2, 0, 500, "RUB"), { code: "BELOW_MIN_TRANSFER", min: 1000, currency: "RUB" })
  assert.deepEqual(evaluateTransfer(L2, 0, 400000, "RUB"), { code: "ABOVE_MAX_TRANSFER", max: 300000, currency: "RUB" })
  assert.deepEqual(evaluateTransfer(L2, 500000, 150000, "RUB"), { code: "LIMIT_EXCEEDED", remaining: 100000, currency: "RUB" })
  assert.equal(evaluateTransfer(L2, 500000, 100000, "RUB"), null) // exactly the remainder fits
})

test("only transfers sent in the limit's own currency are limited", () => {
  assert.equal(evaluateTransfer(L2, 599999, 100000, "USD"), null)
})

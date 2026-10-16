import assert from "node:assert/strict"
import { test } from "node:test"
import { formatMoneyDisplay as f } from "../src/money/format-money"

test("symbols first, no .00 on whole, cents kept otherwise", () => {
  assert.equal(f(450, "USD"), "$450")
  assert.equal(f(24190.32, "USD"), "$24,190.32")
  assert.equal(f(12500, "RUB"), "₽12,500")
  assert.equal(f(9, "EUR"), "€9")
  assert.equal(f(5512, "GHS"), "₵5,512")
  assert.equal(f(1500.9, "KES"), "KSh1,500.90")
})

test("breakdowns always show cents", () => {
  assert.equal(f(450, "USD", { breakdown: true }), "$450.00")
  assert.equal(f(2.5, "USD", { breakdown: true }), "$2.50")
})

test("true minus, plus for money in, CFA with space, no-minor currencies", () => {
  assert.equal(f(-450, "USD"), "−$450")
  assert.equal(f(450, "USD", { signed: true }), "+$450")
  assert.equal(f(250000, "XOF"), "CFA 250,000")
  assert.equal(f(25000.7, "RWF", { breakdown: true }), "R₣25,001")
})

test("missing values", () => {
  assert.equal(f(null, "USD"), "—")
  assert.equal(f("abc", "USD"), "—")
})

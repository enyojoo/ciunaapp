import assert from "node:assert/strict"
import { test } from "node:test"
import { computeFee, resolveFee, type FeeRule } from "./resolve-fee"

let n = 0
const rule = (o: Partial<FeeRule>): FeeRule => ({
  id: `r${++n}`, kind: "commission", scope: "platform", service_line: null, category: null, merchant_id: null,
  percent: null, fixed_amount: null, currency: null, min_fee: null, max_fee: null, waive_above: null,
  active: true, starts_at: null, ends_at: null, created_at: `2026-01-0${(n % 9) + 1}`, ...o,
})
const ctx = { kind: "commission" as const, merchantId: "m1", serviceLine: "food", category: "Meals", currency: "RUB" }

test("percent, fixed, min and max combine and round to cents", () => {
  assert.equal(computeFee({ percent: 8, fixed_amount: null, currency: null, min_fee: null, max_fee: null, waive_above: null }, 1000, "RUB"), 80)
  assert.equal(computeFee({ percent: 8, fixed_amount: 10, currency: "RUB", min_fee: null, max_fee: null, waive_above: null }, 1000, "RUB"), 90)
  assert.equal(computeFee({ percent: 1, fixed_amount: null, currency: "RUB", min_fee: 50, max_fee: null, waive_above: null }, 1000, "RUB"), 50)
  assert.equal(computeFee({ percent: 20, fixed_amount: null, currency: "RUB", min_fee: null, max_fee: 100, waive_above: null }, 1000, "RUB"), 100)
  assert.equal(computeFee({ percent: 3.333, fixed_amount: null, currency: null, min_fee: null, max_fee: null, waive_above: null }, 100, "RUB"), 3.33)
})

test("fee never exceeds the amount and a foreign-currency fixed part is ignored", () => {
  assert.equal(computeFee({ percent: null, fixed_amount: 500, currency: "RUB", min_fee: null, max_fee: null, waive_above: null }, 100, "RUB"), 100)
  assert.equal(computeFee({ percent: 10, fixed_amount: 500, currency: "USD", min_fee: 999, max_fee: null, waive_above: null }, 1000, "RUB"), 100)
})

test("payout fee is waived at or above the threshold", () => {
  const r = { percent: 1, fixed_amount: null, currency: null, min_fee: null, max_fee: null, waive_above: 10000 }
  assert.equal(computeFee(r, 9999, "RUB"), 99.99)
  assert.equal(computeFee(r, 10000, "RUB"), 0)
})

test("most specific rule wins: merchant > plan > category > service line > platform", () => {
  const rules = [
    rule({ scope: "platform", percent: 10 }),
    rule({ scope: "service_line", service_line: "food", percent: 8 }),
    rule({ scope: "category", service_line: "food", category: "Meals", percent: 6 }),
  ]
  assert.equal(resolveFee(rules, null, ctx, 1000).source, "category")
  assert.equal(resolveFee(rules, null, ctx, 1000).fee, 60)
  assert.equal(resolveFee(rules, null, { ...ctx, category: "Drinks" }, 1000).source, "service_line")
  assert.equal(resolveFee(rules, null, { ...ctx, serviceLine: "mart" }, 1000).source, "platform")
  const plan = { id: "p1", commission_percent: 4 }
  assert.equal(resolveFee(rules, plan, ctx, 1000).source, "plan")
  assert.equal(resolveFee(rules, plan, ctx, 1000).fee, 40)
  const withMerchant = [...rules, rule({ scope: "merchant", merchant_id: "m1", percent: 2 })]
  assert.equal(resolveFee(withMerchant, plan, ctx, 1000).source, "merchant")
  assert.equal(resolveFee(withMerchant, plan, { ...ctx, merchantId: "m2" }, 1000).source, "plan")
})

test("inactive, expired, future and wrong-kind rules are ignored; newest wins ties", () => {
  const at = new Date("2026-06-01")
  const rules = [
    rule({ scope: "service_line", service_line: "food", percent: 1, active: false }),
    rule({ scope: "service_line", service_line: "food", percent: 2, ends_at: "2026-05-01" }),
    rule({ scope: "service_line", service_line: "food", percent: 3, starts_at: "2026-07-01" }),
    rule({ scope: "service_line", service_line: "food", percent: 4, kind: "payout" }),
    rule({ scope: "service_line", service_line: "food", percent: 5, created_at: "2026-01-01" }),
    rule({ scope: "service_line", service_line: "food", percent: 6, created_at: "2026-03-01" }),
  ]
  const r = resolveFee(rules, null, { ...ctx, at }, 1000)
  assert.equal(r.percent, 6)
  assert.equal(resolveFee([], null, ctx, 1000).source, "none")
  assert.equal(resolveFee([], null, ctx, 1000).fee, 0)
})

test("a fixed-only rule in another currency does not apply", () => {
  const rules = [rule({ scope: "platform", percent: 10 }), rule({ scope: "service_line", service_line: "food", fixed_amount: 50, currency: "USD" })]
  assert.equal(resolveFee(rules, null, ctx, 1000).source, "platform")
})


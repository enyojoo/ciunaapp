import test from "node:test"
import assert from "node:assert/strict"
import { computeHubCartTotals } from "../../lib/hub-cart-pricing"

const product = (over: Record<string, unknown> = {}) =>
  ({ id: "p1", title: "Jollof", fixed_currency: "RUB", fixed_amount: 100, list_price: 100, pricing_type: "fixed", fee_percent: 5, ...over }) as never
const rate = (over: Record<string, unknown> = {}) =>
  ({ from_currency: "RUB", to_currency: "RUB", rate: 1, fee_type: "free", fee_amount: 0, ...over }) as never

test("cart totals: lines, hub fee and total in the same currency", () => {
  const t = computeHubCartTotals([{ product: product(), quantity: 2 }], rate())
  assert.equal(t.subtotalReceive, 200)
  assert.equal(t.hubFeeReceive, 10)
  assert.equal(t.totalReceive, 210)
  assert.equal(t.lines[0]!.lineTotal, 200)
})

test("a sale price replaces the list price", () => {
  const t = computeHubCartTotals([{ product: product({ sale_price: 80, fixed_amount: 80 }), quantity: 1 }], rate())
  assert.equal(t.lines[0]!.unitPrice, 80)
})

test("an empty cart and mixed currencies are rejected", () => {
  assert.throws(() => computeHubCartTotals([], rate()), /Cart is empty/)
  assert.throws(
    () => computeHubCartTotals([{ product: product(), quantity: 1 }, { product: product({ id: "p2", fixed_currency: "NGN" }), quantity: 1 }], rate()),
    /same price currency/,
  )
})

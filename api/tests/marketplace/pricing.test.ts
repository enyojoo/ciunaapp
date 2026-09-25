import test from "node:test"
import assert from "node:assert/strict"
import { marketplaceTotals, marketplaceDeadline } from "../../../packages/shared/src/marketplace/pricing"
import { encryptToken, decryptToken } from "../../lib/marketplace/token-crypto"
const calculate = (input: Partial<Parameters<typeof marketplaceTotals>[0]> = {}) =>
  marketplaceTotals({
    lines: [{ unitPrice: 100, quantity: 2, feePercent: 5 }],
    productCurrency: "RUB",
    payCurrency: "NGN",
    rate: 2,
    ...input,
  })
test("fees remain in product currency; delivery once; conversion once; corridor last", () => {
  assert.deepEqual(calculate({ deliveryFee: 10, corridorFeeType: "percentage", corridorFeeAmount: 10 }), {
    productCurrency: "RUB",
    payCurrency: "NGN",
    subtotal: 200,
    marketplaceFee: 10,
    deliveryFee: 10,
    exchangeRate: 2,
    convertedSubtotal: 110,
    corridorFee: 11,
    total: 121,
  })
  assert.equal(
    calculate({ payCurrency: "RUB", rate: 1, corridorFeeType: "fixed", corridorFeeAmount: 3 }).total,
    213,
  )
})
test("decimal rounding, single-line direct/cart parity and invalid quantities", () => {
  assert.equal(calculate({ lines: [{ unitPrice: 0.1, quantity: 3, feePercent: 5 }], rate: 1 }).total, 0.32)
  assert.equal(calculate({ lines: [{ unitPrice: 100, quantity: 1, feePercent: 5 }] }).total, 52.5)
  for (const quantity of [0, -1, 1.5, NaN, 10001])
    assert.throws(() => calculate({ lines: [{ unitPrice: 1, quantity, feePercent: 0 }] }))
  assert.throws(() => calculate({ rate: 0 }))
  assert.throws(() => calculate({ deliveryFee: -1 }))
})
test("deadlines follow line defaults and appointment cutoff", () => {
  const now = Date.parse("2026-09-25T09:00:00Z")
  for (const [line, rail, minutes] of [
    ["food", "manual", 30],
    ["mart", "manual", 120],
    ["experts", "manual", 60],
    ["mart", "yookassa", 15],
  ] as const)
    assert.equal(Date.parse(marketplaceDeadline(line, rail, now)) - now, minutes * 60000)
  assert.equal(
    marketplaceDeadline("experts", "manual", now, "2026-09-25T10:20:00Z"),
    "2026-09-25T09:20:00.000Z",
  )
  assert.throws(() => marketplaceDeadline("experts", "manual", now, "2026-09-25T09:30:00Z"))
})
test("native replay token is encrypted and bound to its attempt", () => {
  process.env.MARKETPLACE_TOKEN_KEY = Buffer.alloc(32, 1).toString("base64")
  const first = encryptToken("private-sdk-token", "attempt-1"),
    second = encryptToken("private-sdk-token", "attempt-1")
  assert.notEqual(first, second)
  assert.ok(!first.includes("private-sdk-token"))
  assert.equal(decryptToken(first, "attempt-1"), "private-sdk-token")
  assert.throws(() => decryptToken(first, "attempt-2"))
  const bytes = Buffer.from(first, "base64")
  bytes[30] ^= 1
  assert.throws(() => decryptToken(bytes.toString("base64"), "attempt-1"))
  delete process.env.MARKETPLACE_TOKEN_KEY
  assert.throws(() => encryptToken("token", "attempt"))
})

test("provider success must match merchant, exact amount, currency, order, attempt and reference", async () => {
  const { providerPaymentMatches } = await import("../../lib/marketplace/provider-validation")
  const a = { id: "attempt", rail: "yookassa", amount: 100, currency: "RUB", provider_id: "payment" }
  const p = {
    id: "payment",
    status: "succeeded",
    metadata: { orderId: "order", attemptId: "attempt" },
    recipient: { account_id: "shop" },
    amount: { value: "100.00", currency: "RUB" },
  }
  assert.equal(providerPaymentMatches(p, a, "order", "shop"), true)
  for (const wrong of [
    { ...p, id: "another" },
    { ...p, status: "unknown" },
    { ...p, metadata: { orderId: "other", attemptId: "attempt" } },
    { ...p, recipient: { account_id: "other" } },
    { ...p, amount: { value: "100.01", currency: "RUB" } },
    { ...p, amount: { value: "100.00", currency: "USD" } },
  ])
    assert.equal(providerPaymentMatches(wrong, a, "order", "shop"), false)
})

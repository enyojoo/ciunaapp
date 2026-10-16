import { test } from "node:test"
import assert from "node:assert/strict"
import { groupBalances, parseAmount, validateAmount, methodsForCurrency, debounce, currentMonthRange, validRange, validateMethodForm, amountToInput } from "./logic"

test("groupBalances hides empty currencies and sorts by available", () => {
  const z = { pending: 0, available: 0, inPayout: 0, paidOut: 0, lifetimeNet: 0 }
  const out = groupBalances([{ currency: "USD", ...z, pending: 5 }, { currency: "EUR", ...z }, { currency: "RUB", ...z, available: 10 }])
  assert.deepEqual(out.map((b) => b.currency), ["RUB", "USD"])
  assert.deepEqual(groupBalances(undefined), [])
})

test("parseAmount handles separators and rejects junk", () => {
  assert.equal(parseAmount("1234.5"), 1234.5)
  assert.equal(parseAmount("1 234,50"), 1234.5)
  assert.equal(parseAmount("1,234.50"), 1234.5)
  assert.equal(parseAmount("1.234,5"), 1234.5)
  assert.equal(parseAmount("1,234"), 1234)
  assert.equal(parseAmount("0"), null)
  assert.equal(parseAmount("-3"), null)
  assert.equal(parseAmount("12.345"), null)
  assert.equal(parseAmount("abc"), null)
  assert.equal(parseAmount(""), null)
})

test("validateAmount checks min and available", () => {
  assert.equal(validateAmount("", 100, 10).error, "AMOUNT_INVALID")
  assert.equal(validateAmount("5", 100, 10).error, "BELOW_MINIMUM_PAYOUT")
  assert.equal(validateAmount("101", 100, 10).error, "INSUFFICIENT_BALANCE")
  assert.deepEqual(validateAmount("100", 100, 10), { amount: 100, error: null })
})

test("amountToInput", () => {
  assert.equal(amountToInput(12), "12")
  assert.equal(amountToInput(12.5), "12.50")
})

test("methodsForCurrency splits verified and puts default first", () => {
  const m = [
    { id: "a", kind: "bank", currency: "USD", label: "A", last4: null, verified: true, is_default: false },
    { id: "b", kind: "bank", currency: "USD", label: "B", last4: null, verified: true, is_default: true },
    { id: "c", kind: "bank", currency: "USD", label: "C", last4: null, verified: false, is_default: false },
    { id: "d", kind: "sbp", currency: "RUB", label: "D", last4: null, verified: true, is_default: false },
  ]
  const r = methodsForCurrency(m, "USD")
  assert.deepEqual(r.verified.map((x) => x.id), ["b", "a"])
  assert.deepEqual(r.unverified.map((x) => x.id), ["c"])
})

test("debounce fires once with the last args and can cancel", async () => {
  const calls: number[] = []
  const d = debounce((n: number) => calls.push(n), 20)
  d(1); d(2); d(3)
  await new Promise((r) => setTimeout(r, 50))
  assert.deepEqual(calls, [3])
  d(4); d.cancel()
  await new Promise((r) => setTimeout(r, 50))
  assert.deepEqual(calls, [3])
})

test("date range", () => {
  assert.deepEqual(currentMonthRange(new Date(2026, 9, 16)), { from: "2026-10-01", to: "2026-10-16" })
  assert.equal(validRange("2026-10-01", "2026-10-16"), true)
  assert.equal(validRange("2026-10-17", "2026-10-16"), false)
  assert.equal(validRange("", "2026-10-16"), false)
})

test("validateMethodForm mirrors the API", () => {
  assert.equal(validateMethodForm("sbp", "USD", {})?.code, "CURRENCY_NOT_SUPPORTED")
  assert.deepEqual(validateMethodForm("sbp", "RUB", { phone: "", bank_name: "x", recipient_name: "y" }), { code: "FIELD_REQUIRED", field: "phone" })
  assert.equal(validateMethodForm("sbp", "RUB", { phone: "123", bank_name: "x", recipient_name: "y" })?.code, "PHONE_INVALID")
  assert.equal(validateMethodForm("sbp", "RUB", { phone: "+7 (900) 123-45-67", bank_name: "x", recipient_name: "y" }), null)
  assert.equal(validateMethodForm("bank", "USD", { account_number: "1", bank_name: "b", recipient_name: "r" }), null)
  assert.equal(validateMethodForm("bank", "USD", { account_number: "1", bank_name: "b" })?.field, "recipient_name")
})

import assert from "node:assert/strict"
import { test } from "node:test"
import { buildOrderReceipt, buildTransferReceipt, maskAccount, payMethodFor } from "../../lib/receipts"

const code = (fn: () => unknown) => {
  try {
    fn()
  } catch (e: any) {
    return e.code as string
  }
  return null
}

const transfer = {
  transaction_id: "CIU-1042", status: "completed", created_at: "2026-10-16T10:00:00Z", completed_at: "2026-10-16T10:20:00Z",
  send_amount: "100.00", send_currency: "USD", receive_amount: "140000", receive_currency: "NGN", exchange_rate: "1400", fee_amount: "3.50", total_amount: "103.50",
  payment_provider: "bitbanker", user: { first_name: "Amara", last_name: "N." },
  recipient: { full_name: "Tunde Bello", account_number: "0123456789", bank_name: "Some Bank" },
}

test("accounts are masked to the last four digits", () => {
  assert.equal(maskAccount("0123456789"), "···· 6789")
  assert.equal(maskAccount("0123 4567 89"), "···· 6789")
  assert.equal(maskAccount("12"), "····")
  assert.equal(maskAccount(null), null)
})

test("a provider is never named: rails become plain methods", () => {
  assert.equal(payMethodFor("bitbanker"), "online")
  assert.equal(payMethodFor("yookassa"), "online")
  assert.equal(payMethodFor("manual"), "bank")
  assert.equal(payMethodFor("something"), null)
})

test("a completed transfer receipt carries amounts and a masked recipient, nothing more", () => {
  const r = buildTransferReceipt(transfer)
  assert.equal(r.status, "completed")
  assert.equal(r.counterparty.account, "···· 6789")
  assert.equal(r.payMethod, "online")
  assert.deepEqual(r.amounts, { currency: "USD", items: 100, fee: 3.5, delivery: 0, conversion: 0, total: 103.5, refunded: null })
  assert.equal(r.transfer?.receiveAmount, 140000)
  assert.equal(r.notTaxInvoice, true)
  const text = JSON.stringify(r)
  assert.ok(!text.includes("0123456789") && !/bitbanker|yookassa/i.test(text) && !text.includes("Some Bank"))
})

test("transfers that are not completed have no receipt; a refunded one keeps it", () => {
  for (const status of ["pending", "processing", "failed", "cancelled"]) assert.equal(code(() => buildTransferReceipt({ ...transfer, status })), "RECEIPT_UNAVAILABLE")
  const r = buildTransferReceipt({ ...transfer, status: "refunded" })
  assert.equal(r.status, "refunded")
  assert.equal(r.amounts.refunded, 103.5)
})

const order = {
  public_id: "CU-7781", line: "food", payment_state: "paid", fulfillment_mode: "delivery", created_at: "2026-10-16T12:00:00Z",
  snapshot: {
    title: "Mama T's Kitchen · 2",
    lines: [{ title: "Jollof rice", quantity: 2, unitPrice: 450 }, { title: "Chin chin", quantity: 1, unitPrice: 250 }],
    totals: { productCurrency: "RUB", payCurrency: "RUB", subtotal: 1150, marketplaceFee: 0, deliveryFee: 100, corridorFee: 0, total: 1250 },
    deliveryAddressLine: "Tverskaya 1",
  },
}

test("an order receipt lists items, fees, the store and the address", () => {
  const r = buildOrderReceipt(order, "Amara N.", "yookassa")
  assert.equal(r.kind, "order")
  assert.equal(r.counterparty.name, "Mama T's Kitchen")
  assert.deepEqual(r.lines.map((l) => l.amount), [900, 250])
  assert.equal(r.amounts.total, 1250)
  assert.equal(r.amounts.delivery, 100)
  assert.equal(r.address, "Tverskaya 1")
  assert.equal(r.payMethod, "online")
})

test("a booking shows the session and the expert; unpaid orders have no receipt", () => {
  const booking = { ...order, line: "experts", fulfillment_mode: "digital", snapshot: { ...order.snapshot, lines: [{ title: "Nutrition session", quantity: 1, unitPrice: 5000 }], totals: { ...order.snapshot.totals, subtotal: 5000, deliveryFee: 0, total: 5000 }, slotStart: "2026-10-20T15:00:00Z", slotEnd: "2026-10-20T16:00:00Z", timezone: "Africa/Lagos" } }
  const r = buildOrderReceipt(booking, "Amara N.", "manual")
  assert.equal(r.kind, "booking")
  assert.equal(r.counterparty.role, "expert")
  assert.deepEqual(r.session, { start: "2026-10-20T15:00:00Z", end: "2026-10-20T16:00:00Z", timezone: "Africa/Lagos" })
  assert.equal(r.address, null)
  for (const payment_state of ["awaiting_payment", "processing", "expired"]) assert.equal(code(() => buildOrderReceipt({ ...order, payment_state }, null)), "RECEIPT_UNAVAILABLE")
  assert.equal(buildOrderReceipt({ ...order, payment_state: "refunded" }, null).status, "refunded")
})

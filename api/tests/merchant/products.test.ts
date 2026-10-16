import assert from "node:assert/strict"
import { test } from "node:test"
import { buildSellerProduct } from "../../lib/merchant/products"
import { MerchantError } from "../../lib/merchant/errors"
import { sellerActions, sellerStatus } from "../../lib/merchant/orders"

const merchant: any = { id: "m1", default_currency: "RUB" }
const vendor = { id: "v1", service_line_slug: "food" }
const bad = (body: any, code: string, existing: any = null) =>
  assert.throws(() => buildSellerProduct(body, merchant, vendor, existing), (e: any) => e instanceof MerchantError && e.code === code)

test("product: valid fixed-price food item maps fulfilment and derives price", () => {
  const row: any = buildSellerProduct({ title: "Jollof rice", category: "Meals", list_price: 450, sale_price: 400, fulfillment_mode: "delivery", stock_quantity: 20 }, merchant, vendor, null)
  assert.equal(row.fulfillment_type, "in_person")
  assert.equal(row.fixed_amount, 400)
  assert.equal(row.fixed_currency, "RUB")
  assert.equal(row.merchant_id, "m1")
  assert.equal(row.service_line_slug, "food")
  assert.equal(row.fee_percent, null)
  assert.equal(row.status, "draft")
})

test("product: pickup maps to vendor, digital to online", () => {
  assert.equal((buildSellerProduct({ title: "Pack", category: "Meals", list_price: 10, fulfillment_mode: "pickup" }, merchant, vendor, null) as any).fulfillment_type, "vendor")
  assert.equal((buildSellerProduct({ title: "Guide", category: "Meals", list_price: 10, fulfillment_mode: "digital" }, merchant, vendor, null) as any).fulfillment_type, "online")
})

test("product: rejects bad input", () => {
  bad({ title: "x", list_price: 10 }, "TITLE_REQUIRED")
  bad({ title: "Rice", category: "Electronics", list_price: 10 }, "CATEGORY_OUTSIDE_LINE")
  bad({ title: "Rice", category: "Meals" }, "PRICE_REQUIRED")
  bad({ title: "Rice", category: "Meals", list_price: 10, sale_price: 10 }, "SALE_PRICE_TOO_HIGH")
  bad({ title: "Rice", category: "Meals", list_price: 10, stock_quantity: -1 }, "INVALID_STOCK")
  bad({ title: "Rice", category: "Meals", list_price: 10, fulfillment_mode: "teleport" }, "FULFILLMENT_REQUIRED")
  bad({ title: "Rice", category: "Meals", list_price: 10, fixed_currency: "XXX" }, "CURRENCY_INVALID")
  bad({ title: "Rice", category: "Meals", list_price: 10, image_url: "http://x/y.png" }, "URL_INVALID")
  bad({ title: "Rice", category: "Meals", list_price: 10, status: "weird" }, "STATUS_INVALID")
})

test("product: partial update keeps existing values and fee/owner stay office-controlled", () => {
  const existing: any = { title: "Rice", category: "Meals", list_price: 100, sale_price: null, fixed_amount: 100, fixed_currency: "RUB", fulfillment_mode: "pickup", fee_percent: 7, owner_team: "ops-a", stock_quantity: 5 }
  const row: any = buildSellerProduct({ stock_quantity: 3, fee_percent: 0, owner_team: "hacker" }, merchant, vendor, existing)
  assert.equal(row.title, "Rice")
  assert.equal(row.list_price, 100)
  assert.equal(row.stock_quantity, 3)
  assert.equal(row.fee_percent, 7)
  assert.equal(row.owner_team, "ops-a")
})

test("orders: seller status and allowed actions follow the database state machine", () => {
  const base = { payment_state: "paid", exception_reason: null, fulfillment_mode: "delivery", line: "food" }
  assert.equal(sellerStatus({ ...base, fulfillment_state: "awaiting_acceptance" }), "new")
  assert.deepEqual(sellerActions({ ...base, fulfillment_state: "awaiting_acceptance" }), ["accept", "reject"])
  assert.deepEqual(sellerActions({ ...base, fulfillment_state: "accepted" }), ["start", "fulfill"])
  assert.deepEqual(sellerActions({ ...base, fulfillment_state: "accepted", line: "experts" }), ["fulfill"])
  assert.deepEqual(sellerActions({ ...base, fulfillment_state: "in_progress" }), ["fulfill"])
  assert.deepEqual(sellerActions({ ...base, fulfillment_state: "fulfilled" }), [])
  assert.deepEqual(sellerActions({ ...base, fulfillment_state: "awaiting_acceptance", exception_reason: "LATE_PAYMENT" }), [])
  assert.deepEqual(sellerActions({ ...base, payment_state: "awaiting_payment", fulfillment_state: "awaiting_acceptance" }), [])
})

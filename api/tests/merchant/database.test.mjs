import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const MIGRATIONS = [
  "20260925090000_marketplace_lifecycle.sql",
  "20260925143000_marketplace_notify_gate.sql",
  "20260925152000_marketplace_cancel_restore_cart.sql",
  "20261016100000_merchants_foundation.sql",
  "20261016110000_ledger_fees_payouts.sql",
]
const uid = "11111111-1111-4111-8111-111111111111"
const pid = "22222222-2222-4222-8222-222222222222"
const mid = "33333333-3333-4333-8333-333333333333"
const owner = "44444444-4444-4444-8444-444444444444"
let seq = 0

async function setup() {
  const db = new PGlite()
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  await db.query("insert into users(id,email,first_name,last_name) values($1,'buyer@example.com','Test','Buyer'),($2,'seller@example.com','Test','Seller')", [uid, owner])
  await db.query("insert into payment_methods(id,currency,status,provider,name,type) values($1,'RUB','active','manual','Bank','bank_transfer')", [mid])
  return db
}

/** A merchant with a live storefront and one paid order moved through accept -> fulfil using the real SQL state machine. */
async function fulfilledOrder(db, merchantId, subtotal = 1000, delivery = 100) {
  const key = `k${++seq}`
  const vrow = (await db.query("select id, updated_at::text as v from hub_vendors where merchant_id=$1", [merchantId])).rows[0]
  const vendor = vrow.id
  await db.query("insert into hub_products(id,title,status,pricing_type,fixed_amount,fixed_currency,fulfillment_mode,stock_quantity,service_line_slug,category,vendor_id) values($1,'Jollof','live','fixed',$2,'RUB','digital',100,'food','Meals',$3) on conflict (id) do nothing", [pid, subtotal, vendor])
  const method = (await db.query("select to_jsonb(payment_methods) as v from payment_methods where id=$1", [mid])).rows[0].v
  const pr = (await db.query("select updated_at::text as v from hub_products where id=$1", [pid])).rows[0].v
  const snap = {
    source: { kind: "product", hubProductId: pid }, title: "Jollof", line: "food", fulfillmentMode: "digital",
    lines: [{ id: pid, productId: pid, title: "Jollof", quantity: 1, unitPrice: subtotal, feePercent: 0, fields: [] }],
    methods: [{ id: mid, rail: "manual", instructions: { name: "Bank" } }],
    totals: { subtotal, convertedSubtotal: subtotal, payCurrency: "RUB", productCurrency: "RUB", exchangeRate: 1, corridorFee: 0, total: subtotal + delivery, marketplaceFee: 0, deliveryFee: delivery },
  }
  const q = (await db.query("insert into marketplace_quotes(user_id,payload,expires_at) values($1,$2,now()+interval '5 minutes') returning id", [uid, { snapshot: snap, vendorId: vendor, vendorVersion: vrow.v, productVersions: { [pid]: pr }, methodRows: { [mid]: method } }])).rows[0].id
  const id = (await db.query("select marketplace_create_order($1,$2,$3,$4,$5,'manual',$6,'embedded',$7) as id", [uid, q, key, "h" + key, { contactName: "T", contactEmail: "buyer@example.com", contactPhone: null }, mid, "T-" + key])).rows[0].id
  const att = (await db.query("select id from marketplace_attempts where order_id=$1", [id])).rows[0].id
  await db.query("select marketplace_transition($1,'paid',$2,$3)", [id, uid, { attemptId: att }])
  await db.query("select marketplace_transition($1,'accept',$2,'{}')", [id, uid])
  await db.query("select marketplace_transition($1,'fulfill',$2,$3)", [id, uid, { note: "done", digitalContent: "code-123" }])
  return id
}

async function merchant(db) {
  const m = (await db.query("insert into merchants(type,slug,display_name,status) values('store','s-test-'||gen_random_uuid(),'Mama T','live') returning id")).rows[0].id
  await db.query("insert into merchant_members(merchant_id,user_id,role) values($1,$2,'owner')", [m, owner])
  await db.query("insert into hub_vendors(service_line_slug,name,slug,merchant_id,is_published) values('food','Mama T','mama-'||gen_random_uuid(),$1,true)", [m])
  return m
}
const bal = async (db, m, kind) => Number((await db.query("select ledger_balance($1,$2,'RUB') as b", [m, kind])).rows[0].b)
const platform = async (db, kind) => Number((await db.query("select coalesce(sum(e.amount),0) as b from ledger_entries e join ledger_accounts a on a.id=e.account_id where a.merchant_id is null and a.kind=$1", [kind])).rows[0].b)

test("orders created for a vendor carry the merchant automatically", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m)
  assert.equal((await db.query("select merchant_id from marketplace_orders where id=$1", [id])).rows[0].merchant_id, m)
})

test("earning is recorded once, balanced, and released after the hold", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m, 1000, 100)
  await db.query("select earning_record($1, 80, '{\"rule\":\"test\"}', 2)", [id])
  await db.query("select earning_record($1, 80, '{}', 2)", [id]) // idempotent
  assert.equal((await db.query("select count(*)::int n from merchant_earnings")).rows[0].n, 1)
  // net = 1000 + 100 - 80
  assert.equal(await bal(db, m, "merchant_pending"), 1020)
  assert.equal(await bal(db, m, "merchant_available"), 0)
  assert.equal(await platform(db, "platform_fees"), 80)
  assert.equal(await platform(db, "platform_funding"), -1100)
  assert.equal((await db.query("select coalesce(sum(amount),0)::numeric s from ledger_entries")).rows[0].s, "0")
  assert.equal((await db.query("select earnings_release_due() as n")).rows[0].n, 0) // still on hold
  await db.query("update merchant_earnings set release_at = now() - interval '1 minute'")
  assert.equal((await db.query("select earnings_release_due() as n")).rows[0].n, 1)
  assert.equal(await bal(db, m, "merchant_available"), 1020)
  assert.equal(await bal(db, m, "merchant_pending"), 0)
  assert.equal((await db.query("select earnings_release_due() as n")).rows[0].n, 0)
})

test("commission cannot exceed the subtotal and unfulfilled orders earn nothing", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m, 500, 0)
  await assert.rejects(db.query("select earning_record($1, 501, '{}', 0)", [id]), /COMMISSION_INVALID/)
})

test("payout request, approval and payment move money through the hold account", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m, 5000, 0)
  await db.query("select earning_record($1, 400, '{}', 0)", [id])
  await db.query("select earnings_release_due()")
  assert.equal(await bal(db, m, "merchant_available"), 4600)
  const method = (await db.query("insert into merchant_payout_methods(merchant_id,kind,currency,label,details_encrypted,last4,verified,is_default) values($1,'card','RUB','Card','enc','4242',true,true) returning id", [m])).rows[0].id

  await assert.rejects(db.query("select payout_request($1,$2,9000,'RUB',$3,1000,0)", [m, method, owner]), /INSUFFICIENT_BALANCE/)
  await assert.rejects(db.query("select payout_request($1,$2,500,'RUB',$3,1000,0)", [m, method, owner]), /BELOW_MINIMUM_PAYOUT/)
  const pay = (await db.query("select payout_request($1,$2,3000,'RUB',$3,1000,30) as id", [m, method, owner])).rows[0].id
  assert.equal(await bal(db, m, "merchant_available"), 1600)
  assert.equal(await bal(db, m, "merchant_payout_hold"), 3000)

  await db.query("select payout_decide($1,'approve',$2)", [pay, owner])
  await assert.rejects(db.query("select payout_decide($1,'paid',$2,'')", [pay, owner]), /REFERENCE_REQUIRED/)
  await db.query("select payout_decide($1,'paid',$2,'BANK-REF-1')", [pay, owner])
  assert.equal(await bal(db, m, "merchant_payout_hold"), 0)
  assert.equal(await platform(db, "platform_payouts"), 2970)
  assert.equal(await platform(db, "platform_fees"), 430) // 400 commission + 30 payout fee
  assert.equal((await db.query("select net from payouts where id=$1", [pay])).rows[0].net, "2970.00")
  await assert.rejects(db.query("select payout_decide($1,'reject',$2,null,'late')", [pay, owner]), /INVALID_TRANSITION/)
  assert.equal((await db.query("select coalesce(sum(amount),0)::numeric s from ledger_entries")).rows[0].s, "0")
})

test("rejected and cancelled payouts return the money; payout needs a verified method", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m, 5000, 0)
  await db.query("select earning_record($1, 0, '{}', 0)", [id])
  await db.query("select earnings_release_due()")
  const unverified = (await db.query("insert into merchant_payout_methods(merchant_id,kind,currency,label,details_encrypted,verified) values($1,'card','RUB','Card','enc',false) returning id", [m])).rows[0].id
  await assert.rejects(db.query("select payout_request($1,$2,2000,'RUB',$3,1000,0)", [m, unverified, owner]), /PAYOUT_METHOD_NOT_VERIFIED/)
  await db.query("update merchant_payout_methods set verified=true where id=$1", [unverified])
  const p1 = (await db.query("select payout_request($1,$2,2000,'RUB',$3,1000,0) as id", [m, unverified, owner])).rows[0].id
  await assert.rejects(db.query("select payout_decide($1,'reject',$2,null,'')", [p1, owner]), /REASON_REQUIRED/)
  await db.query("select payout_decide($1,'reject',$2,null,'Details do not match')", [p1, owner])
  assert.equal(await bal(db, m, "merchant_available"), 5000)
  const p2 = (await db.query("select payout_request($1,$2,2000,'RUB',$3,1000,0) as id", [m, unverified, owner])).rows[0].id
  await db.query("select payout_decide($1,'cancel',$2)", [p2, owner])
  assert.equal(await bal(db, m, "merchant_available"), 5000)
  assert.equal(await bal(db, m, "merchant_payout_hold"), 0)
})

test("reversal claws back an earning, even after release, and is idempotent", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m, 1000, 0)
  await db.query("select earning_record($1, 100, '{}', 0)", [id])
  await db.query("select earnings_release_due()")
  await db.query("select earning_reverse($1,'refund')", [id])
  await db.query("select earning_reverse($1,'refund')", [id])
  assert.equal(await bal(db, m, "merchant_available"), 0)
  assert.equal(await platform(db, "platform_fees"), 0)
  assert.equal(await platform(db, "platform_funding"), 0)
  assert.equal((await db.query("select status from merchant_earnings")).rows[0].status, "reversed")
})

test("ledger is append-only and rejects unbalanced postings", async () => {
  const db = await setup()
  const m = await merchant(db)
  await assert.rejects(db.query(`select ledger_post('x','t',$1)`, [JSON.stringify([{ merchant_id: m, kind: "merchant_pending", currency: "RUB", amount: 5 }])]), /LEDGER_UNBALANCED/)
  const id = await fulfilledOrder(db, m)
  await db.query("select earning_record($1, 0, '{}', 0)", [id])
  await assert.rejects(db.query("update ledger_entries set amount = 1"), /append-only/)
  await assert.rejects(db.query("delete from ledger_entries"), /append-only/)
})

test("fee rules enforce a coherent scope and seeded commissions exist", async () => {
  const db = await setup()
  assert.equal((await db.query("select count(*)::int n from fee_rules where kind='commission' and scope='service_line'")).rows[0].n, 3)
  await assert.rejects(db.query("insert into fee_rules(kind,scope,percent) values('commission','merchant',5)"), /violates check/)
  await assert.rejects(db.query("insert into fee_rules(kind,scope,service_line) values('commission','service_line','food')"), /violates check/)
  await assert.rejects(db.query("insert into fee_rules(kind,scope,fixed_amount) values('commission','platform',10)"), /violates check/)
})

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
  "20261016120000_seller_notifications.sql",
  "20261016130000_reviews.sql",
  "20261016150000_marketplace_analytics.sql",
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

const other = "55555555-5555-4555-8555-555555555555"
const submit = (db, order, user, rating, body = "", lang = "en") => db.query("select review_submit($1,$2,$3,$4,$5) as id", [order, user, rating, body, lang])
const agg = async (db, m) => (await db.query("select rating_avg::text a, rating_count c from merchants where id=$1", [m])).rows[0]
const vendorAgg = async (db, m) => (await db.query("select rating_avg::text a, rating_count c from hub_vendors where merchant_id=$1", [m])).rows[0]

test("only the customer of a fulfilled order can review it", async () => {
  const db = await setup()
  await db.query("insert into users(id,email,first_name,last_name) values($1,'other@example.com','Other','Person')", [other])
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m)
  await assert.rejects(submit(db, id, other, 5), /REVIEW_NOT_ALLOWED/)
  await assert.rejects(submit(db, "99999999-9999-4999-8999-999999999999", uid, 5), /REVIEW_NOT_ALLOWED/)
  await db.query("update marketplace_orders set fulfillment_state='accepted' where id=$1", [id])
  await assert.rejects(submit(db, id, uid, 5), /REVIEW_NOT_ALLOWED/)
  await db.query("update marketplace_orders set fulfillment_state='fulfilled' where id=$1", [id])
  const rid = (await submit(db, id, uid, 5, "  Great food  ")).rows[0].id
  const row = (await db.query("select * from reviews where id=$1", [rid])).rows[0]
  assert.equal(row.merchant_id, m)
  assert.equal(row.target_type, "vendor")
  assert.equal(row.body, "Great food")
  assert.equal(row.status, "published")
})

test("rating must be 1 to 5 and the text at most 1000 characters", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m)
  for (const bad of [0, 6, -1, null]) await assert.rejects(submit(db, id, uid, bad), /RATING_INVALID/)
  await assert.rejects(submit(db, id, uid, 5, "x".repeat(1001)), /BODY_TOO_LONG/)
  await submit(db, id, uid, 4, "")
  assert.equal((await db.query("select body from reviews")).rows[0].body, "")
})

test("reviews are closed 30 days after fulfilment", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m)
  await db.query("update marketplace_orders set updated_at = now() - interval '31 days' where id=$1", [id])
  await assert.rejects(submit(db, id, uid, 5), /REVIEW_WINDOW_CLOSED/)
  await db.query("update marketplace_orders set updated_at = now() - interval '29 days' where id=$1", [id])
  await submit(db, id, uid, 5)
})

test("one review per order; editable for 48 hours, then locked", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m)
  const first = (await submit(db, id, uid, 2, "Cold")).rows[0].id
  const second = (await submit(db, id, uid, 4, "Better after a call")).rows[0].id
  assert.equal(first, second)
  const rows = (await db.query("select rating, body from reviews")).rows
  assert.equal(rows.length, 1)
  assert.deepEqual(rows[0], { rating: 4, body: "Better after a call" })
  // editing after the 30 day purchase window is still fine inside the 48 hour edit window
  await db.query("update marketplace_orders set updated_at = now() - interval '40 days' where id=$1", [id])
  await submit(db, id, uid, 5, "Great")
  await db.query("update reviews set created_at = now() - interval '49 hours'")
  await assert.rejects(submit(db, id, uid, 1, "Changed my mind"), /ALREADY_REVIEWED/)
  assert.equal((await db.query("select rating from reviews")).rows[0].rating, 5)
})

test("aggregates follow publish, edit, hide and unhide, on merchant, vendor and expert profile", async () => {
  const db = await setup()
  const m = await merchant(db)
  await db.query("insert into expert_profiles(display_name,merchant_id,is_published,capabilities) values('Coach',$1,true,'{}')", [m])
  assert.deepEqual(await agg(db, m), { a: null, c: 0 })
  const o1 = await fulfilledOrder(db, m)
  const o2 = await fulfilledOrder(db, m)
  const r1 = (await submit(db, o1, uid, 5)).rows[0].id
  assert.deepEqual(await agg(db, m), { a: "5.00", c: 1 })
  const r2 = (await submit(db, o2, uid, 2)).rows[0].id
  assert.deepEqual(await agg(db, m), { a: "3.50", c: 2 })
  assert.deepEqual(await vendorAgg(db, m), { a: "3.50", c: 2 })
  assert.deepEqual((await db.query("select rating_avg::text a, rating_count c from expert_profiles where merchant_id=$1", [m])).rows[0], { a: "3.50", c: 2 })

  // edit within window recalculates
  await submit(db, o2, uid, 3)
  assert.deepEqual(await agg(db, m), { a: "4.00", c: 2 })

  await assert.rejects(db.query("select review_moderate($1,true,'')", [r1]), /REASON_REQUIRED/)
  await db.query("select review_moderate($1,true,'Abusive language.')", [r1])
  assert.deepEqual(await agg(db, m), { a: "3.00", c: 1 })
  assert.deepEqual(await vendorAgg(db, m), { a: "3.00", c: 1 })
  const hidden = (await db.query("select status, hidden_reason from reviews where id=$1", [r1])).rows[0]
  assert.deepEqual(hidden, { status: "hidden", hidden_reason: "Abusive language." })

  await db.query("select review_moderate($1,false,null)", [r1])
  assert.deepEqual(await agg(db, m), { a: "4.00", c: 2 })
  assert.equal((await db.query("select hidden_reason from reviews where id=$1", [r1])).rows[0].hidden_reason, null)

  await db.query("select review_moderate($1,true,'Not about this purchase.')", [r1])
  await db.query("select review_moderate($1,true,'Not about this purchase.')", [r2])
  assert.deepEqual(await agg(db, m), { a: null, c: 0 })
  await assert.rejects(db.query("select review_moderate($1,true,'Reason here')", ["99999999-9999-4999-8999-999999999999"]), /REVIEW_NOT_FOUND/)
})

test("review distribution counts published reviews per star and ignores hidden ones", async () => {
  const db = await setup()
  const m = await merchant(db)
  const a = await fulfilledOrder(db, m)
  const b = await fulfilledOrder(db, m)
  const c = await fulfilledOrder(db, m)
  await submit(db, a, uid, 5)
  await submit(db, b, uid, 5)
  const rc = (await submit(db, c, uid, 1)).rows[0].id
  await db.query("select review_moderate($1,true,'Abusive language.')", [rc])
  const d = (await db.query("select review_distribution($1,'vendor') as d", [m])).rows[0].d
  assert.deepEqual(d, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2 })
  assert.deepEqual((await db.query("select review_distribution($1,'expert') as d", [m])).rows[0].d, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
})

test("reply: once, 600 characters, own merchant only, editable for 24 hours", async () => {
  const db = await setup()
  const m = await merchant(db)
  const m2 = await merchant(db)
  const id = await fulfilledOrder(db, m)
  const rid = (await submit(db, id, uid, 4, "Good")).rows[0].id
  await assert.rejects(db.query("select review_reply($1,$2,$3,'Thanks')", [rid, m2, owner]), /REVIEW_NOT_FOUND/)
  await assert.rejects(db.query("select review_reply($1,$2,$3,'   ')", [rid, m, owner]), /REPLY_REQUIRED/)
  await assert.rejects(db.query("select review_reply($1,$2,$3,$4)", [rid, m, owner, "x".repeat(601)]), /REPLY_TOO_LONG/)
  await db.query("select review_reply($1,$2,$3,'Thank you!')", [rid, m, owner])
  const first = (await db.query("select reply, reply_at, reply_by from reviews where id=$1", [rid])).rows[0]
  assert.equal(first.reply, "Thank you!")
  assert.equal(first.reply_by, owner)
  await db.query("select review_reply($1,$2,$3,'Thank you, come again!')", [rid, m, owner])
  const edited = (await db.query("select reply, reply_at from reviews where id=$1", [rid])).rows[0]
  assert.equal(edited.reply, "Thank you, come again!")
  assert.deepEqual(edited.reply_at, first.reply_at) // the window runs from the first reply
  await db.query("update reviews set reply_at = now() - interval '25 hours' where id=$1", [rid])
  await assert.rejects(db.query("select review_reply($1,$2,$3,'Too late')", [rid, m, owner]), /REPLY_LOCKED/)
  // a hidden review cannot be replied to
  await db.query("select review_moderate($1,true,'Abusive language.')", [rid])
  await assert.rejects(db.query("select review_reply($1,$2,$3,'Hello')", [rid, m, owner]), /REVIEW_NOT_FOUND/)
})

test("an order for an expert becomes an expert review", async () => {
  const db = await setup()
  const m = await merchant(db)
  const id = await fulfilledOrder(db, m)
  await db.query("update marketplace_orders set line='experts' where id=$1", [id])
  await submit(db, id, uid, 5)
  assert.equal((await db.query("select target_type from reviews")).rows[0].target_type, "expert")
})

test("reviews are service-role only: RLS on, no grants to public roles", async () => {
  const db = await setup()
  assert.equal((await db.query("select relrowsecurity r from pg_class where relname='reviews'")).rows[0].r, true)
  assert.equal((await db.query("select count(*)::int n from pg_policies where tablename='reviews'")).rows[0].n, 0)
})

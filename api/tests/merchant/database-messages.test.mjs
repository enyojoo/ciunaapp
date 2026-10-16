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
  "20261016140000_order_messages.sql",
]
const uid = "11111111-1111-4111-8111-111111111111"
const stranger = "11111111-1111-4111-8111-999999999999"
const pid = "22222222-2222-4222-8222-222222222222"
const mid = "33333333-3333-4333-8333-333333333333"
const owner = "44444444-4444-4444-8444-444444444444"
const manager = "44444444-4444-4444-8444-555555555555"
const staff = "44444444-4444-4444-8444-666666666666"
const finance = "44444444-4444-4444-8444-777777777777"
const outsider = "44444444-4444-4444-8444-888888888888"
let seq = 0

async function setup() {
  const db = new PGlite()
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  for (const [id, email] of [[uid, "buyer"], [stranger, "stranger"], [owner, "owner"], [manager, "manager"], [staff, "staff"], [finance, "finance"], [outsider, "outsider"]]) {
    await db.query("insert into users(id,email,first_name,last_name) values($1,$2,'Test','User')", [id, email + "@example.com"])
  }
  await db.query("insert into payment_methods(id,currency,status,provider,name,type) values($1,'RUB','active','manual','Bank','bank_transfer')", [mid])
  return db
}

async function merchant(db, solo = false) {
  const m = (await db.query("insert into merchants(type,slug,display_name,status) values('store','s-test-'||gen_random_uuid(),'Mama T','live') returning id")).rows[0].id
  // a solo merchant is owned by the outsider (one owned merchant per user) and has no team
  for (const [u, r] of solo ? [[outsider, "owner"]] : [[owner, "owner"], [manager, "manager"], [staff, "staff"], [finance, "finance"]]) {
    await db.query("insert into merchant_members(merchant_id,user_id,role) values($1,$2,$3)", [m, u, r])
  }
  await db.query("insert into hub_vendors(service_line_slug,name,slug,merchant_id,is_published) values('food','Mama T','mama-'||gen_random_uuid(),$1,true)", [m])
  return m
}

/** stage: "created" (unpaid) | "paid" | "fulfilled" */
async function order(db, merchantId, stage = "paid") {
  const key = `k${++seq}`
  const vrow = (await db.query("select id, updated_at::text as v from hub_vendors where merchant_id=$1", [merchantId])).rows[0]
  await db.query("insert into hub_products(id,title,status,pricing_type,fixed_amount,fixed_currency,fulfillment_mode,stock_quantity,service_line_slug,category,vendor_id) values($1,'Jollof','live','fixed',1000,'RUB','digital',1000,'food','Meals',$2) on conflict (id) do nothing", [pid, vrow.id])
  const method = (await db.query("select to_jsonb(payment_methods) as v from payment_methods where id=$1", [mid])).rows[0].v
  const pr = (await db.query("select updated_at::text as v from hub_products where id=$1", [pid])).rows[0].v
  const snap = {
    source: { kind: "product", hubProductId: pid }, title: "Jollof", line: "food", fulfillmentMode: "digital",
    lines: [{ id: pid, productId: pid, title: "Jollof", quantity: 1, unitPrice: 1000, feePercent: 0, fields: [] }],
    methods: [{ id: mid, rail: "manual", instructions: { name: "Bank" } }],
    totals: { subtotal: 1000, convertedSubtotal: 1000, payCurrency: "RUB", productCurrency: "RUB", exchangeRate: 1, corridorFee: 0, total: 1100, marketplaceFee: 0, deliveryFee: 100 },
  }
  const q = (await db.query("insert into marketplace_quotes(user_id,payload,expires_at) values($1,$2,now()+interval '5 minutes') returning id", [uid, { snapshot: snap, vendorId: vrow.id, vendorVersion: vrow.v, productVersions: { [pid]: pr }, methodRows: { [mid]: method } }])).rows[0].id
  const id = (await db.query("select marketplace_create_order($1,$2,$3,$4,$5,'manual',$6,'embedded',$7) as id", [uid, q, key, "h" + key, { contactName: "Amina Okafor", contactEmail: "buyer@example.com", contactPhone: null }, mid, "T-" + key])).rows[0].id
  if (stage === "created") return id
  const att = (await db.query("select id from marketplace_attempts where order_id=$1", [id])).rows[0].id
  await db.query("select marketplace_transition($1,'paid',$2,$3)", [id, uid, { attemptId: att }])
  if (stage === "fulfilled") {
    await db.query("select marketplace_transition($1,'accept',$2,'{}')", [id, uid])
    await db.query("select marketplace_transition($1,'fulfill',$2,$3)", [id, uid, { note: "done", digitalContent: "code" }])
  }
  return id
}
const send = (db, o, kind, who, body = "Hello", lang = "en") => db.query("select (message_send($1,$2,$3,$4,$5)).id as id", [o, kind, who, body, lang])

test("chat only exists for paid orders that belong to a merchant", async () => {
  const db = await setup()
  const m = await merchant(db)
  const unpaid = await order(db, m, "created")
  await assert.rejects(send(db, unpaid, "customer", uid), /CHAT_UNAVAILABLE/)
  assert.equal((await db.query("select message_chat_state($1) as s", [unpaid])).rows[0].s, "unavailable")
  const paid = await order(db, m, "paid")
  assert.equal((await db.query("select message_chat_state($1) as s", [paid])).rows[0].s, "open")
  const first = (await send(db, paid, "customer", uid, "  Where is it?  ")).rows[0].id
  assert.ok(first)
  const row = (await db.query("select body, merchant_id, sender_kind from order_messages where id=$1", [first])).rows[0]
  assert.equal(row.body, "Where is it?")
  assert.equal(row.merchant_id, m)
  await db.query("update marketplace_orders set merchant_id = null where id=$1", [paid])
  await assert.rejects(send(db, paid, "customer", uid), /CHAT_UNAVAILABLE/)
  await assert.rejects(send(db, "99999999-9999-4999-8999-999999999999", "customer", uid), /ORDER_NOT_FOUND/)
})

test("each side must belong to the order; finance and outsiders cannot send", async () => {
  const db = await setup()
  const m = await merchant(db)
  const other = await merchant(db, true)
  const o = await order(db, m)
  await assert.rejects(send(db, o, "customer", stranger), /ORDER_NOT_FOUND/)
  await assert.rejects(send(db, o, "customer", owner), /ORDER_NOT_FOUND/) // a seller cannot pose as the customer
  await assert.rejects(send(db, o, "merchant", uid), /ORDER_NOT_FOUND/) // the customer is not a member
  await assert.rejects(send(db, o, "merchant", outsider), /ORDER_NOT_FOUND/) // member of a different merchant only
  await assert.rejects(send(db, o, "merchant", finance), /ORDER_NOT_FOUND/)
  await assert.rejects(send(db, o, "bot", owner), /FORBIDDEN/)
  assert.ok(other)
  for (const u of [owner, manager, staff]) assert.ok((await send(db, o, "merchant", u, "On it")).rows[0].id)
})

test("body is validated and language sanitised", async () => {
  const db = await setup()
  const o = await order(db, await merchant(db))
  await assert.rejects(send(db, o, "customer", uid, "   "), /MESSAGE_EMPTY/)
  await assert.rejects(send(db, o, "customer", uid, "x".repeat(2001)), /MESSAGE_TOO_LONG/)
  assert.ok((await send(db, o, "customer", uid, "x".repeat(2000))).rows[0].id)
  const id = (await send(db, o, "customer", uid, "hi", "<bad>")).rows[0].id
  assert.equal((await db.query("select language from order_messages where id=$1", [id])).rows[0].language, "en")
  const ru = (await send(db, o, "customer", uid, "привет", "RU")).rows[0].id
  assert.equal((await db.query("select language from order_messages where id=$1", [ru])).rows[0].language, "ru")
})

test("chat closes 14 days after fulfilment but stays open before", async () => {
  const db = await setup()
  const o = await order(db, await merchant(db), "fulfilled")
  assert.ok((await send(db, o, "customer", uid, "Thanks")).rows[0].id)
  await db.query("update marketplace_orders set updated_at = now() - interval '13 days' where id=$1", [o])
  assert.ok((await send(db, o, "merchant", owner, "You're welcome")).rows[0].id)
  await db.query("update marketplace_orders set updated_at = now() - interval '15 days' where id=$1", [o])
  assert.equal((await db.query("select message_chat_state($1) as s", [o])).rows[0].s, "closed")
  await assert.rejects(send(db, o, "customer", uid), /CHAT_CLOSED/)
  await assert.rejects(send(db, o, "merchant", owner), /CHAT_CLOSED/)
  // an order still in progress never closes, however old
  const live = await order(db, await merchant(db, true), "paid")
  await db.query("update marketplace_orders set updated_at = now() - interval '60 days' where id=$1", [live])
  assert.ok((await send(db, live, "customer", uid)).rows[0].id)
})

test("rate limit is 30 per hour per side per order", async () => {
  const db = await setup()
  const m = await merchant(db)
  const o = await order(db, m)
  const o2 = await order(db, m)
  for (let i = 0; i < 30; i++) await send(db, o, "customer", uid, "m" + i)
  await assert.rejects(send(db, o, "customer", uid, "one too many"), /RATE_LIMITED/)
  assert.ok((await send(db, o, "merchant", owner, "still fine")).rows[0].id) // the other side has its own budget
  assert.ok((await send(db, o2, "customer", uid, "other order")).rows[0].id) // and so does another order
  await db.exec("alter table order_messages disable trigger order_messages_guard") // test-only backdating
  await db.query("update order_messages set created_at = now() - interval '2 hours' where order_id=$1 and sender_kind='customer'", [o])
  await db.exec("alter table order_messages enable trigger order_messages_guard")
  assert.ok((await send(db, o, "customer", uid, "later")).rows[0].id)
})

test("read marking only touches the other side's messages, once", async () => {
  const db = await setup()
  const o = await order(db, await merchant(db))
  await send(db, o, "customer", uid, "a")
  await send(db, o, "customer", uid, "b")
  await send(db, o, "merchant", owner, "c")
  assert.deepEqual((await db.query("select * from messages_unread_customer($1)", [uid])).rows.map((r) => [r.order_id, r.unread]), [[o, 1]])
  assert.equal((await db.query("select messages_mark_read($1,'merchant') as n", [o])).rows[0].n, 2)
  assert.equal((await db.query("select messages_mark_read($1,'merchant') as n", [o])).rows[0].n, 0)
  assert.equal((await db.query("select count(*)::int n from order_messages where sender_kind='merchant' and read_by_other_at is not null")).rows[0].n, 0)
  assert.equal((await db.query("select messages_mark_read($1,'customer') as n", [o])).rows[0].n, 1)
  assert.equal((await db.query("select count(*)::int n from messages_unread_customer($1)", [uid])).rows[0].n, 0)
  await assert.rejects(db.query("select messages_mark_read($1,'x')", [o]), /FORBIDDEN/)
})

test("messages are append-only", async () => {
  const db = await setup()
  const o = await order(db, await merchant(db))
  const id = (await send(db, o, "customer", uid, "original")).rows[0].id
  await assert.rejects(db.query("update order_messages set body='edited' where id=$1", [id]), /MESSAGES_APPEND_ONLY/)
  await assert.rejects(db.query("update order_messages set sender_kind='merchant' where id=$1", [id]), /MESSAGES_APPEND_ONLY/)
  await assert.rejects(db.query("delete from order_messages where id=$1", [id]), /MESSAGES_APPEND_ONLY/)
  await db.query("select messages_mark_read($1,'merchant')", [o])
  await assert.rejects(db.query("update order_messages set read_by_other_at = null where id=$1", [id]), /MESSAGES_APPEND_ONLY/)
  assert.equal((await db.query("select body from order_messages where id=$1", [id])).rows[0].body, "original")
})

test("threads list is per merchant, newest first, with unread counts", async () => {
  const db = await setup()
  const m = await merchant(db)
  const other = await merchant(db, true)
  const a = await order(db, m)
  const b = await order(db, m)
  const c = await order(db, other)
  await send(db, a, "customer", uid, "first")
  await send(db, b, "customer", uid, "second")
  await send(db, b, "merchant", owner, "reply")
  await send(db, c, "customer", uid, "elsewhere")
  const t = (await db.query("select * from messages_threads($1,50)", [m])).rows
  assert.deepEqual(t.map((r) => r.order_id), [b, a])
  assert.deepEqual(t.map((r) => r.unread), [1, 1])
  assert.equal(t[0].last_sender_kind, "merchant")
  assert.equal(t[0].contact_name, "Amina Okafor")
  assert.equal(t[0].chat_state, "open")
})

test("a customer message alerts owner, manager and staff but not finance, once per burst", async () => {
  const db = await setup()
  const m = await merchant(db)
  const o = await order(db, m)
  await db.query("delete from seller_outbox")
  await send(db, o, "merchant", owner, "seller speaking")
  assert.equal((await db.query("select count(*)::int n from seller_outbox where kind='message_new'")).rows[0].n, 0)
  await send(db, o, "customer", uid, "Is my order on the way? ".repeat(10))
  const rows = (await db.query("select user_id, channel, payload from seller_outbox where kind='message_new'")).rows
  assert.deepEqual(rows.map((r) => r.user_id).sort(), [manager, owner, staff].sort())
  assert.ok(rows.every((r) => r.channel === "email"))
  assert.equal(rows[0].payload.orderId, o)
  assert.ok(rows[0].payload.publicId)
  assert.equal(rows[0].payload.preview.length, 120)
  assert.ok(!rows.some((r) => r.user_id === finance))
  await send(db, o, "customer", uid, "and another")
  assert.equal((await db.query("select count(*)::int n from seller_outbox where kind='message_new'")).rows[0].n, 3)
})

test("table is service-role only", async () => {
  const db = await setup()
  const rls = (await db.query("select relrowsecurity r from pg_class where relname='order_messages'")).rows[0].r
  assert.equal(rls, true)
  assert.equal((await db.query("select count(*)::int n from pg_policies where tablename='order_messages'")).rows[0].n, 0)
})

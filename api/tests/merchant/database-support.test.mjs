import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const MIGRATIONS = fs.readdirSync(root + "supabase/migrations").filter((f) => f >= "20260925").sort()

const customer = "11111111-1111-4111-8111-111111111111"
const other = "22222222-2222-4222-8222-222222222222"
const agent = "33333333-3333-4333-8333-333333333333"

async function setup() {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  await db.query("insert into users(id,email,first_name,last_name) values($1,'a@example.com','Ada','C'),($2,'b@example.com','Bo','D'),($3,'s@example.com','Sam','Agent')", [customer, other, agent])
  return db
}
const create = (db, user = customer, topic = "payment", subject = "My payment is stuck", order = null, body = "Hello, I paid but nothing changed.") =>
  db.query("select support_create($1,$2,$3,$4,$5) as id", [user, topic, subject, order, body]).then((r) => r.rows[0].id)
const row = async (db, id) => (await db.query("select * from support_requests where id = $1", [id])).rows[0]

test("a request starts open with the first message, a preview and one unread for staff", async () => {
  const db = await setup()
  const id = await create(db)
  const r = await row(db, id)
  assert.equal(r.status, "open")
  assert.equal(r.agent_unread, 1)
  assert.equal(r.customer_unread, 0)
  assert.match(r.public_id, /^SR-[0-9A-F]{8}$/)
  assert.equal(r.last_message_preview, "Hello, I paid but nothing changed.")
  assert.equal((await db.query("select count(*)::int as n from support_messages where request_id = $1", [id])).rows[0].n, 1)
})

test("an agent reply waits for the customer; a customer reply reopens; unread counts follow", async () => {
  const db = await setup()
  const id = await create(db)
  await db.query("select support_mark_read($1,'agent')", [id])
  await db.query("select support_send($1,'agent',$2,'We are checking it.')", [id, agent])
  let r = await row(db, id)
  assert.equal(r.status, "awaiting_customer")
  assert.equal(r.customer_unread, 1)
  await db.query("select support_mark_read($1,'customer')", [id])
  assert.equal((await row(db, id)).customer_unread, 0)
  await db.query("select support_send($1,'customer',$2,'Thanks, any news?')", [id, customer])
  r = await row(db, id)
  assert.equal(r.status, "open")
  assert.equal(r.agent_unread, 1)
})

test("resolving leaves a system line; a customer message reopens within 14 days, not after", async () => {
  const db = await setup()
  const id = await create(db)
  await db.query("select support_resolve($1,$2)", [id, agent])
  await db.query("select support_resolve($1,$2)", [id, agent]) // second call does nothing
  assert.equal((await db.query("select count(*)::int as n from support_messages where request_id=$1 and sender_kind='system'", [id])).rows[0].n, 1)
  assert.equal((await row(db, id)).status, "resolved")
  await db.query("select support_send($1,'customer',$2,'It happened again.')", [id, customer])
  assert.equal((await row(db, id)).status, "open")
  await db.query("select support_resolve($1,$2)", [id, agent])
  await db.query("update support_requests set resolved_at = now() - interval '15 days' where id = $1", [id])
  await assert.rejects(db.query("select support_send($1,'customer',$2,'Late.')", [id, customer]), /SUPPORT_CLOSED/)
})

test("a customer cannot write to or link someone else's request or order", async () => {
  const db = await setup()
  const id = await create(db)
  await assert.rejects(db.query("select support_send($1,'customer',$2,'Not mine.')", [id, other]), /SUPPORT_NOT_FOUND/)
  await assert.rejects(create(db, customer, "order", "Where is it", "99999999-9999-4999-8999-999999999999"), /SUPPORT_ORDER_NOT_FOUND/)
  await assert.rejects(db.query("select support_send($1,'agent',$2,'x')", ["99999999-9999-4999-8999-999999999999", agent]), /SUPPORT_NOT_FOUND/)
  await assert.rejects(db.query("select support_send($1,'system',$2,'x')", [id, agent]), /SUPPORT_BAD_SENDER/)
})

test("at most 10 unresolved requests per customer; resolving frees a slot", async () => {
  const db = await setup()
  const ids = []
  for (let i = 0; i < 10; i++) ids.push(await create(db, customer, "other", `Question number ${i}`))
  await assert.rejects(create(db, customer, "other", "One too many"), /SUPPORT_TOO_MANY_OPEN/)
  await create(db, other, "other", "Someone else is fine")
  await db.query("select support_resolve($1,$2)", [ids[0], agent])
  await create(db, customer, "other", "Now there is room")
})

test("bad input is rejected by the table rules and the tables are service-role only", async () => {
  const db = await setup()
  await assert.rejects(create(db, customer, "weather", "Bad topic"), /check/i)
  await assert.rejects(create(db, customer, "other", "ab"), /check/i)
  await assert.rejects(create(db, customer, "other", "Fine subject", null, "   "), /check/i)
  await db.exec("set role anon")
  await assert.rejects(db.query("select * from support_requests"), /permission denied/)
  await db.exec("reset role")
})

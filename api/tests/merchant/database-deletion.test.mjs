import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const MIGRATIONS = fs.readdirSync(root + "supabase/migrations").filter((f) => f >= "20260925").sort()
const u = "11111111-1111-4111-8111-111111111111"

async function setup() {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  await db.query("insert into users(id,email,first_name,last_name,phone) values($1,'a@example.com','Ada','C','+100')", [u])
  return db
}
const request = (db, days = 30) => db.query("select account_request_deletion($1, 'leaving', $2) as r", [u, days]).then((r) => r.rows[0].r)

test("a clean account is disabled at once and scheduled for removal", async () => {
  const db = await setup()
  const r = await request(db)
  assert.equal(r.ok, true)
  const user = (await db.query("select deleted_at from users where id = $1", [u])).rows[0]
  assert.ok(user.deleted_at)
  assert.equal((await db.query("select status from account_deletions where user_id = $1", [u])).rows[0].status, "requested")
})

test("a transfer in progress blocks deletion", async () => {
  const db = await setup()
  await db.query("update users set id = id where id = $1", [u])
  await db.query("insert into transactions(transaction_id,user_id,send_amount,send_currency,receive_amount,receive_currency,exchange_rate,fee_amount,fee_type,total_amount,status) values('T1',$1,10,'USD',900,'RUB',90,0,'fixed',10,'processing')", [u])
  const r = await request(db)
  assert.equal(r.ok, false)
  assert.equal(r.blockers.transfers, 1)
  assert.equal((await db.query("select deleted_at from users where id = $1", [u])).rows[0].deleted_at, null)
})

test("restoring before the date puts the account back", async () => {
  const db = await setup()
  await request(db)
  assert.equal((await db.query("select account_restore($1) as ok", [u])).rows[0].ok, true)
  assert.equal((await db.query("select deleted_at from users where id = $1", [u])).rows[0].deleted_at, null)
  assert.equal((await db.query("select account_restore($1) as ok", [u])).rows[0].ok, false)
})

test("only requests past their date are purged; personal data goes, the user row stays de-identified", async () => {
  const db = await setup()
  await db.exec("create table recipients(id serial primary key, user_id uuid, name text)")
  await db.query("insert into recipients(user_id,name) values($1,'Mum')", [u])
  await request(db, 30)
  assert.equal((await db.query("select count(*)::int n from account_purge_due()")).rows[0].n, 0)
  await db.query("update account_deletions set purge_after = now() - interval '1 minute'")
  const ids = (await db.query("select * from account_purge_due()")).rows
  assert.equal(ids.length, 1)
  const user = (await db.query("select email, first_name, phone from users where id = $1", [u])).rows[0]
  assert.match(user.email, /@deleted\.invalid$/)
  assert.equal(user.first_name, "Deleted")
  assert.equal(user.phone, null)
  assert.equal((await db.query("select count(*)::int n from recipients")).rows[0].n, 0)
  assert.equal((await db.query("select count(*)::int n from account_purge_due()")).rows[0].n, 0)
})

test("deletion functions are service-role only", async () => {
  const db = await setup()
  await db.exec("set role anon")
  await assert.rejects(db.query("select account_purge_due()"), /permission denied/)
  await db.exec("reset role")
})

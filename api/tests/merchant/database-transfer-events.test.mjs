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
  await db.query("insert into users(id,email,first_name,last_name) values($1,'a@example.com','A','B')", [u])
  return db
}
const insertTx = (db, id) => db.query("insert into transactions(transaction_id,user_id,send_amount,send_currency,receive_amount,receive_currency,exchange_rate,total_amount) values($1,$2,10,'USD',900,'RUB',90,10) returning id", [id, u]).then((r) => r.rows[0].id)

test("every status change of a transfer is recorded once, in order", async () => {
  const db = await setup()
  const id = await insertTx(db, "T1")
  await db.query("update transactions set status = 'processing' where id = $1", [id])
  await db.query("update transactions set updated_at = now() where id = $1", [id]) // no status change: no event
  await db.query("update transactions set status = 'completed' where id = $1", [id])
  const rows = (await db.query("select status from transfer_events where transaction_id = $1 order by id", [id])).rows.map((r) => r.status)
  assert.deepEqual(rows, ["pending", "processing", "completed"])
})

test("new events start unsent; the migration marks existing transfers as already handled", async () => {
  const db = await setup()
  const id = await insertTx(db, "T2")
  assert.equal((await db.query("select count(*)::int n from transfer_events where transaction_id = $1 and notified_at is null", [id])).rows[0].n, 1)
  const sql = fs.readFileSync(root + "supabase/migrations/20261019130000_transfer_events.sql", "utf8")
  await db.exec("delete from transfer_events")
  await db.exec(sql) // re-run: backfills the existing transfer as handled
  assert.equal((await db.query("select count(*)::int n from transfer_events where notified_at is null")).rows[0].n, 0)
  assert.equal((await db.query("select count(*)::int n from transfer_events")).rows[0].n, 1)
})

test("transfer events are service-role only", async () => {
  const db = await setup()
  await db.exec("set role anon")
  await assert.rejects(db.query("select * from transfer_events"), /permission denied/)
  await db.exec("reset role")
})

import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const MIGRATIONS = fs.readdirSync(root + "supabase/migrations").filter((f) => f >= "20260925").sort()
const u = "11111111-1111-4111-8111-111111111111"
const other = "22222222-2222-4222-8222-222222222222"

async function setup() {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  await db.query("insert into users(id,email,first_name,last_name) values($1,'a@example.com','A','B'),($2,'b@example.com','C','D')", [u, other])
  return db
}
const tx = (db, id, provider = "bitbanker", source = "send") =>
  db.query("insert into transactions(transaction_id,user_id,send_amount,send_currency,receive_amount,receive_currency,exchange_rate,total_amount,payment_provider,transaction_source) values($1,$2,10,'RUB',900,'NGN',90,10,$3,$4)", [id, u, provider, source])

test("online transfers get a 15-minute window; manual and marketplace ones do not", async () => {
  const db = await setup()
  await tx(db, "T-ONLINE")
  await tx(db, "T-MANUAL", "manual")
  await tx(db, "T-HUB", "yookassa", "hub")
  const rows = (await db.query("select transaction_id, payment_expires_at is not null as has, extract(epoch from payment_expires_at - created_at)::int as secs from transactions order by transaction_id")).rows
  assert.deepEqual(rows, [{ transaction_id: "T-HUB", has: false, secs: null }, { transaction_id: "T-MANUAL", has: false, secs: null }, { transaction_id: "T-ONLINE", has: true, secs: 900 }])
})

test("the owner can cancel a pending transfer once; others and paid ones cannot", async () => {
  const db = await setup()
  await tx(db, "T1")
  assert.deepEqual((await db.query("select cancel_transfer($1, 't1') as r", [other])).rows[0].r, { ok: false, error: "TRANSFER_NOT_FOUND" })
  assert.deepEqual((await db.query("select cancel_transfer($1, 't1') as r", [u])).rows[0].r, { ok: true })
  assert.deepEqual((await db.query("select cancel_transfer($1, 'T1') as r", [u])).rows[0].r, { ok: true, already: true })
  await tx(db, "T2")
  await db.query("update transactions set gateway_status = 'paid' where transaction_id = 'T2'")
  assert.deepEqual((await db.query("select cancel_transfer($1, 'T2') as r", [u])).rows[0].r, { ok: false, error: "TRANSFER_NOT_CANCELLABLE" })
})

test("only transfers past their window and unpaid are expired", async () => {
  const db = await setup()
  await tx(db, "LATE")
  await tx(db, "LATE-PAID")
  await tx(db, "FRESH")
  await db.query("update transactions set payment_expires_at = now() - interval '1 minute' where transaction_id in ('LATE','LATE-PAID')")
  await db.query("update transactions set gateway_status = 'paid' where transaction_id = 'LATE-PAID'")
  assert.equal((await db.query("select count(*)::int n from expire_stale_transfers()")).rows[0].n, 1)
  const st = (await db.query("select transaction_id, status from transactions order by transaction_id")).rows
  assert.deepEqual(st, [{ transaction_id: "FRESH", status: "pending" }, { transaction_id: "LATE", status: "cancelled" }, { transaction_id: "LATE-PAID", status: "pending" }])
  assert.equal((await db.query("select count(*)::int n from transfer_events where status = 'cancelled'")).rows[0].n, 1)
})

test("the payment functions are service-role only", async () => {
  const db = await setup()
  await db.exec("set role anon")
  await assert.rejects(db.query("select expire_stale_transfers()"), /permission denied/)
  await db.exec("reset role")
})

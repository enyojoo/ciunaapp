import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const MIGRATIONS = fs.readdirSync(root + "supabase/migrations").filter((f) => f >= "20260925").sort()
const user = "11111111-1111-4111-8111-111111111111"
const other = "22222222-2222-4222-8222-222222222222"

async function setup() {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  await db.query("insert into users(id,email,first_name,last_name) values($1,'a@example.com','Ada','C'),($2,'b@example.com','Bo','D')", [user, other])
  return db
}
let n = 0
const tx = (db, u, amount, currency, status = "completed", source = "send", createdAt = "now()") =>
  db.query(
    `insert into transactions(transaction_id,user_id,send_amount,send_currency,receive_amount,receive_currency,exchange_rate,total_amount,status,transaction_source,created_at)
     values($1,$2,$3,$4,$3,'NGN',1,$3,$5,$6,${createdAt})`,
    [`T${++n}`, u, amount, currency, status, source],
  )
const usage = async (db, u, currency, since = "2026-10-01T00:00:00Z") => Number((await db.query("select send_usage($1,$2,$3) as v", [u, currency, since])).rows[0].v)

test("usage counts this month's Send transfers in the currency and skips failed, cancelled and other kinds", async () => {
  const db = await setup()
  await tx(db, user, 1000, "RUB", "completed", "send", "'2026-10-05'")
  await tx(db, user, 2000, "RUB", "pending", "send", "'2026-10-06'")
  await tx(db, user, 4000, "RUB", "processing", "send", "'2026-10-07'")
  await tx(db, user, 8000, "RUB", "failed", "send", "'2026-10-08'")
  await tx(db, user, 16000, "RUB", "cancelled", "send", "'2026-10-09'")
  await tx(db, user, 32000, "RUB", "refunded", "send", "'2026-10-09'")
  await tx(db, user, 64000, "RUB", "completed", "hub", "'2026-10-10'") // a store order, not a transfer
  await tx(db, user, 128000, "USD", "completed", "send", "'2026-10-10'") // another currency
  await tx(db, user, 256000, "RUB", "completed", "send", "'2026-09-30'") // last month
  await tx(db, other, 512000, "RUB", "completed", "send", "'2026-10-10'") // someone else
  assert.equal(await usage(db, user, "RUB"), 7000)
  assert.equal(await usage(db, user, "USD"), 128000)
  assert.equal(await usage(db, user, "NGN"), 0)
})

test("limits need compliance to set them: empty by default, with sane rules once set", async () => {
  const db = await setup()
  assert.equal((await db.query("select count(*)::int as n from send_limits")).rows[0].n, 0)
  await db.query("insert into send_limits(level,currency,monthly_amount,min_per_transfer,max_per_transfer) values (1,'RUB',50000,1000,50000)")
  await assert.rejects(db.query("insert into send_limits(level,currency,monthly_amount) values (4,'RUB',1)"), /check/i)
  await assert.rejects(db.query("insert into send_limits(level,currency,monthly_amount) values (2,'rub',1)"), /check/i)
  await assert.rejects(db.query("insert into send_limits(level,currency,monthly_amount) values (2,'RUB',0)"), /check/i)
  await assert.rejects(db.query("insert into send_limits(level,currency,monthly_amount,min_per_transfer,max_per_transfer) values (2,'RUB',100,500,100)"), /check/i)
})

test("send limits and usage are service-role only", async () => {
  const db = await setup()
  await db.exec("set role anon")
  await assert.rejects(db.query("select * from send_limits"), /permission denied/)
  await assert.rejects(db.query("select send_usage($1,'RUB',now())", [user]), /permission denied/)
  await db.exec("reset role")
})

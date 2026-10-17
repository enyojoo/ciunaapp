import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const MIGRATIONS = fs.readdirSync(root + "supabase/migrations").filter((f) => f >= "20260925").sort()
const sql = fs.readFileSync(root + "supabase/migrations/20261019110000_push_preferences.sql", "utf8")

async function setup() {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  return db
}

test("existing events are marked as handled, so turning notifications on sends nothing old", async () => {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec("create table users(id uuid primary key); create table marketplace_events(id serial primary key, kind text, created_at timestamptz default now())")
  await db.exec("insert into marketplace_events(kind) values ('paid'),('accept')")
  await db.exec(sql)
  await db.exec("insert into marketplace_events(kind) values ('fulfill')")
  const r = (await db.query("select count(*) filter (where notified_at is null)::int as fresh, count(*)::int as total from marketplace_events")).rows[0]
  assert.deepEqual(r, { fresh: 1, total: 3 })
  await db.exec(sql) // safe to re-run
})

test("preferences default to on and are service-role only", async () => {
  const db = await setup()
  const u = "11111111-1111-4111-8111-111111111111"
  await db.query("insert into users(id,email,first_name,last_name) values($1,'a@example.com','A','B')", [u])
  await db.query("insert into push_preferences(user_id) values($1)", [u])
  assert.deepEqual((await db.query("select orders,messages,support from push_preferences")).rows[0], { orders: true, messages: true, support: true })
  await db.exec("set role anon")
  await assert.rejects(db.query("select * from push_preferences"), /permission denied/)
  await db.exec("reset role")
})

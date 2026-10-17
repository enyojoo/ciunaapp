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

test("one alert per customer and expert, removed with either", async () => {
  const db = await setup()
  const cols = (await db.query("select column_name from information_schema.columns where table_name = 'expert_profiles'")).rows.map((r) => r.column_name)
  assert.ok(cols.includes("id"))
  const e = (await db.query("insert into expert_profiles(display_name, slug, capabilities) values('Ada','ada','{}') returning id")).rows[0].id
  await db.query("insert into expert_slot_alerts(user_id, expert_profile_id) values($1,$2)", [u, e])
  await assert.rejects(db.query("insert into expert_slot_alerts(user_id, expert_profile_id) values($1,$2)", [u, e]), /duplicate|unique/i)
  await db.query("delete from users where id = $1", [u])
  assert.equal((await db.query("select count(*)::int n from expert_slot_alerts")).rows[0].n, 0)
})

test("alerts are service-role only", async () => {
  const db = await setup()
  await db.exec("set role anon")
  await assert.rejects(db.query("select * from expert_slot_alerts"), /permission denied/)
  await db.exec("reset role")
})

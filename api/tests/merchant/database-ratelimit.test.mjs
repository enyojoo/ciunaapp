import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")

test("rate limit: N allowed, then blocked in the same window; keys are independent", async () => {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec(fs.readFileSync(root + "supabase/migrations/20261017100000_rate_limits.sql", "utf8"))
  const hit = async (k) => (await db.query("select rate_limit_hit($1, 3, 60) as ok", [k])).rows[0].ok
  assert.deepEqual([await hit("auth:1.2.3.4"), await hit("auth:1.2.3.4"), await hit("auth:1.2.3.4")], [true, true, true])
  assert.equal(await hit("auth:1.2.3.4"), false) // 4th in the window is blocked
  assert.equal(await hit("auth:5.6.7.8"), true) // another client is unaffected
  assert.equal(await hit("cart:1.2.3.4"), true) // another scope is unaffected
})

test("rate limit SQL is idempotent and service-role only", async () => {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  const sql = fs.readFileSync(root + "supabase/migrations/20261017100000_rate_limits.sql", "utf8")
  await db.exec(sql)
  await db.exec(sql)
  await db.exec("set role anon")
  await assert.rejects(db.query("select rate_limit_hit('x', 1, 60)"), /permission denied/)
  await db.exec("reset role")
})

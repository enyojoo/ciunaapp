import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")

// The same order the deploy files are run in (see supabase/deploy/RUN-ORDER.md).
const MIGRATIONS = fs.readdirSync(root + "supabase/migrations").filter((f) => f >= "20260925").sort()
const sql = fs.readFileSync(root + "supabase/deploy/verify-all.sql", "utf8")
// The check is the first statement; the second reads seeded data.
const [catalogQuery, dataQuery] = sql.split(/;\s*\n/).filter((s) => /^\s*(with|select)\b/im.test(s.replace(/^(\s*--[^\n]*\n)+/g, "")))

async function fresh() {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  return db
}

test("verify-all.sql reports nothing missing once every migration is applied", async () => {
  const db = await fresh()
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  const rows = (await db.query(catalogQuery)).rows
  assert.ok(rows.length > 40, "the check should cover many objects, got " + rows.length)
  assert.deepEqual(rows.filter((r) => !r.ok), [])
  const data = (await db.query(dataQuery)).rows[0]
  assert.deepEqual(Object.values(data), [true, true, true])
})

test("verify-all.sql flags a database where the newest files were not run", async () => {
  const db = await fresh()
  for (const m of MIGRATIONS.filter((f) => f < "20261017140000")) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  const missing = (await db.query(catalogQuery)).rows.filter((r) => !r.ok)
  assert.ok(missing.length > 0)
  const unrun = new Set(["storefront-details.sql", "support-requests.sql", "send-limits.sql", "push-tokens.sql", "account-deletion.sql", "push-preferences.sql", "store-pause.sql", "transfer-events.sql", "booking-reminders.sql", "payment-expiry.sql", "expert-slot-alerts.sql", "quiet-hours.sql", "expert-main-category.sql", "product-main-category.sql", "store-communities.sql"])
  assert.ok(missing.every((r) => unrun.has(r.file)), "only the unrun files should be flagged: " + JSON.stringify([...new Set(missing.map((r) => r.file))]))
  assert.ok(missing.some((r) => r.file === "support-requests.sql") && missing.some((r) => r.file === "storefront-details.sql"))
})

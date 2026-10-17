import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const MIGRATIONS = fs.readdirSync(root + "supabase/migrations").filter((f) => f >= "20260925").sort()
const sql = fs.readFileSync(root + "supabase/migrations/20261019140000_booking_reminders.sql", "utf8")

test("the migration does not remind bookings that are about to start or already past, but leaves later ones for the job", async () => {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS.filter((f) => f < "20261019140000")) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  const cols = (await db.query("select column_name from information_schema.columns where table_name = 'expert_bookings'")).rows.map((r) => r.column_name)
  assert.ok(cols.includes("slot_start") && cols.includes("status"))
  await db.exec("alter table expert_bookings alter column user_id drop not null, alter column expert_profile_id drop not null, alter column expert_service_id drop not null, alter column expert_service_slot_id drop not null")
  await db.exec("insert into expert_bookings(status,slot_start,slot_end,transaction_id) values ('confirmed', now() + interval '30 minutes', now() + interval '90 minutes', 'A'), ('confirmed', now() + interval '3 hours', now() + interval '4 hours', 'B'), ('confirmed', now() - interval '1 day', now() - interval '23 hours', 'C')")
  await db.exec(sql)
  const rows = (await db.query("select transaction_id, reminder_sent_at is not null as handled from expert_bookings order by transaction_id")).rows
  assert.deepEqual(rows, [{ transaction_id: "A", handled: true }, { transaction_id: "B", handled: false }, { transaction_id: "C", handled: true }])
  await db.exec(sql) // safe to re-run
})

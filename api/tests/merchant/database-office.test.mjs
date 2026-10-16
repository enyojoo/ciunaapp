import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const MIGRATIONS = [
  "20260925090000_marketplace_lifecycle.sql",
  "20260925143000_marketplace_notify_gate.sql",
  "20260925152000_marketplace_cancel_restore_cart.sql",
  "20261016100000_merchants_foundation.sql",
  "20261016110000_ledger_fees_payouts.sql",
]
const OFFICE = fs.readFileSync(root + "supabase/migrations/20261017120000_office_queues.sql", "utf8")
const adminA = "aaaaaaaa-0000-4000-8000-00000000000a"
const adminB = "bbbbbbbb-0000-4000-8000-00000000000b"

async function setup() {
  const db = new PGlite()
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  await db.exec(OFFICE)
  return db
}
const merchant = async (db, status = "in_review") =>
  (await db.query("insert into merchants(type,slug,display_name,status) values('store','s-'||gen_random_uuid(),'Mama T',$1) returning id", [status])).rows[0].id
const product = async (db, status = "pending") =>
  (await db.query("insert into hub_products(title,status,pricing_type,fixed_amount,fixed_currency,service_line_slug,category,review_status) values('Jollof','live','fixed',500,'RUB','food','Meals',$1) returning id", [status])).rows[0].id

test("migration is idempotent: a second run changes nothing and keeps seeds", async () => {
  const db = await setup()
  const count = async () => ({
    templates: (await db.query("select count(*)::int n from reason_templates")).rows[0].n,
    sla: (await db.query("select count(*)::int n from marketplace_settings where key='office_sla'")).rows[0].n,
    cols: (await db.query("select count(*)::int n from information_schema.columns where table_name='hub_products' and column_name like 'review_%'")).rows[0].n,
  })
  const first = await count()
  await db.exec(OFFICE)
  assert.deepEqual(await count(), first)
  assert.equal(first.templates, 8)
  assert.equal(first.sla, 1)
  const sla = (await db.query("select value from marketplace_settings where key='office_sla'")).rows[0].value
  assert.equal(sla.merchant_application, 24)
  assert.equal(sla.listing_review, 12)
  assert.equal(sla.payout, 48)
  assert.equal(sla.kyc_business_hours, 4)
})

test("new tables are RLS-protected with no policies (service role only)", async () => {
  const db = await setup()
  const rows = (await db.query("select relname, relrowsecurity from pg_class where relname in ('reason_templates','office_saved_views')")).rows
  assert.equal(rows.length, 2)
  assert.ok(rows.every((r) => r.relrowsecurity))
  assert.equal((await db.query("select count(*)::int n from pg_policies where tablename in ('reason_templates','office_saved_views')")).rows[0].n, 0)
})

test("saved views are unique per user, scope and name and limited to known scopes", async () => {
  const db = await setup()
  await db.query("insert into office_saved_views(user_id,scope,name,filters) values($1,'merchants','Mine','{\"mine\":true}')", [adminA])
  await assert.rejects(db.query("insert into office_saved_views(user_id,scope,name,filters) values($1,'merchants','Mine','{}')", [adminA]))
  await db.query("insert into office_saved_views(user_id,scope,name,filters) values($1,'merchants','Mine','{}')", [adminB])
  await assert.rejects(db.query("insert into office_saved_views(user_id,scope,name,filters) values($1,'users','x','{}')", [adminA]))
})

test("merchant application claim: first wins, second gets the owner, release frees it, super admin can force", async () => {
  const db = await setup()
  const m = await merchant(db)
  await db.query("insert into merchant_applications(merchant_id,status) values($1,'in_review')", [m])
  const claim = async (admin, release = false, force = false) => (await db.query("select office_claim('merchant',$1,$2,$3,$4) as r", [m, admin, release, force])).rows[0].r
  const a = await claim(adminA)
  assert.equal(a.ok, true)
  assert.equal(a.owner, adminA)
  const b = await claim(adminB)
  assert.equal(b.ok, false)
  assert.equal(b.code, "CLAIMED")
  assert.equal(b.owner, adminA)
  assert.equal((await claim(adminA)).ok, true) // idempotent for the owner
  assert.equal((await claim(adminB, true)).code, "CLAIMED") // cannot release someone else's claim
  assert.equal((await claim(adminB, false, true)).owner, adminB) // forced take-over
  assert.equal((await claim(adminB, true)).owner, null)
  const row = (await db.query("select assigned_to, claimed_at from merchant_applications where merchant_id=$1", [m])).rows[0]
  assert.equal(row.assigned_to, null)
  assert.equal(row.claimed_at, null)
  assert.equal((await claim(adminA)).owner, adminA)
})

test("claiming a merchant with no open application, or an unknown kind, fails cleanly", async () => {
  const db = await setup()
  const m = await merchant(db, "live")
  assert.equal((await db.query("select office_claim('merchant',$1,$2) as r", [m, adminA])).rows[0].r.code, "NOT_FOUND")
  assert.equal((await db.query("select office_claim('order',$1,$2) as r", [m, adminA])).rows[0].r.code, "INVALID_KIND")
})

test("listing review clock starts when a listing enters review and the owner clears when it leaves", async () => {
  const db = await setup()
  const p = await product(db, "pending")
  let row = (await db.query("select review_requested_at, review_assigned_to from hub_products where id=$1", [p])).rows[0]
  assert.ok(row.review_requested_at, "clock started on insert")
  assert.equal(row.review_assigned_to, null)

  const claim = async (admin) => (await db.query("select office_claim('listing',$1,$2) as r", [p, admin])).rows[0].r
  assert.equal((await claim(adminA)).owner, adminA)
  assert.equal((await claim(adminB)).code, "CLAIMED")

  // an edit that keeps it pending does not reset the clock or the owner
  const before = (await db.query("select review_requested_at from hub_products where id=$1", [p])).rows[0].review_requested_at
  await db.query("update hub_products set title='Jollof rice', review_status='pending' where id=$1", [p])
  row = (await db.query("select review_requested_at, review_assigned_to from hub_products where id=$1", [p])).rows[0]
  assert.equal(String(row.review_requested_at), String(before))
  assert.equal(row.review_assigned_to, adminA)

  await db.query("update hub_products set review_status='approved' where id=$1", [p])
  row = (await db.query("select review_assigned_to, review_claimed_at from hub_products where id=$1", [p])).rows[0]
  assert.equal(row.review_assigned_to, null)
  assert.equal(row.review_claimed_at, null)
  assert.equal((await claim(adminA)).code, "NOT_FOUND") // no longer in review

  // a content edit sends it back: clock restarts
  await db.query("update hub_products set review_status='pending' where id=$1", [p])
  const again = (await db.query("select review_requested_at from hub_products where id=$1", [p])).rows[0].review_requested_at
  assert.ok(again)
})

test("existing pending listings get a start time from the migration backfill", async () => {
  const db = new PGlite()
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  for (const m of MIGRATIONS) await db.exec(fs.readFileSync(root + "supabase/migrations/" + m, "utf8"))
  const p = await product(db, "pending")
  await db.exec(OFFICE)
  assert.ok((await db.query("select review_requested_at from hub_products where id=$1", [p])).rows[0].review_requested_at)
})

test("claim function is not executable by anon or authenticated", async () => {
  const db = await setup()
  const r = (await db.query(`select
    has_function_privilege('anon', 'office_claim(text,uuid,uuid,boolean,boolean)', 'execute') as anon,
    has_function_privilege('authenticated', 'office_claim(text,uuid,uuid,boolean,boolean)', 'execute') as authed,
    has_function_privilege('service_role', 'office_claim(text,uuid,uuid,boolean,boolean)', 'execute') as svc`)).rows[0]
  assert.deepEqual(r, { anon: false, authed: false, svc: true })
})

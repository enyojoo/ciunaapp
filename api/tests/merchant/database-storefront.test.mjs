import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const sql = fs.readFileSync(root + "supabase/migrations/20261017140000_storefront_details.sql", "utf8")

// Only the columns the migration touches or reads.
const base = `
  create table merchants (id uuid primary key default gen_random_uuid(), cover_url text, languages text[] not null default array['en'], status text, kyb_tier smallint not null default 0);
  create table hub_vendors (id uuid primary key default gen_random_uuid(), merchant_id uuid);
  create table expert_profiles (id uuid primary key default gen_random_uuid(), merchant_id uuid);
  create table marketplace_zones (id uuid primary key default gen_random_uuid());
`

test("storefront details: defaults, backfill from the merchant, and safe to re-run", async () => {
  const db = new PGlite()
  await db.exec(base)
  const m = (await db.query(`insert into merchants (cover_url, languages, status, kyb_tier) values ('https://x/c.jpg', array['en','ru'], 'live', 2) returning id`)).rows[0].id
  await db.query(`insert into hub_vendors (merchant_id) values ($1)`, [m])
  await db.query(`insert into expert_profiles (merchant_id) values ($1)`, [m])
  await db.exec(sql)
  await db.exec(sql) // idempotent

  const v = (await db.query(`select opening_hours, time_zone, cover_url, verification_tier, min_order_amount from hub_vendors`)).rows[0]
  assert.deepEqual(v.opening_hours, {})
  assert.equal(v.time_zone, "UTC")
  assert.equal(v.cover_url, "https://x/c.jpg")
  assert.equal(v.verification_tier, 2)
  assert.equal(v.min_order_amount, null)

  const e = (await db.query(`select languages, is_verified, verification_tier, credentials from expert_profiles`)).rows[0]
  assert.deepEqual(e.languages, ["en", "ru"])
  assert.equal(e.is_verified, true)
  assert.equal(e.verification_tier, 2)
  assert.deepEqual(e.credentials, [])
})

test("storefront details: an unverified or paused merchant is not marked verified", async () => {
  const db = new PGlite()
  await db.exec(base)
  const m = (await db.query(`insert into merchants (status, kyb_tier) values ('paused', 1) returning id`)).rows[0].id
  await db.query(`insert into expert_profiles (merchant_id) values ($1)`, [m])
  await db.exec(sql)
  assert.equal((await db.query(`select is_verified from expert_profiles`)).rows[0].is_verified, false)
})

test("storefront details: constraints reject nonsense", async () => {
  const db = new PGlite()
  await db.exec(base)
  await db.query(`insert into hub_vendors default values`)
  await db.query(`insert into marketplace_zones default values`)
  await db.exec(sql)
  await assert.rejects(db.query(`update hub_vendors set min_order_amount = -1`), /check/i)
  await assert.rejects(db.query(`update hub_vendors set min_order_currency = 'rub'`), /check/i)
  await assert.rejects(db.query(`update hub_vendors set verification_tier = 3`), /check/i)
  await assert.rejects(db.query(`update marketplace_zones set eta_minutes = 0`), /check/i)
  await assert.rejects(db.query(`update marketplace_zones set eta_minutes = 2000`), /check/i)
  await db.query(`update marketplace_zones set eta_minutes = 45`)
  await db.query(`update hub_vendors set min_order_amount = 500, min_order_currency = 'RUB'`)
})

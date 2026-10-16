#!/usr/bin/env node
// Proves the Seller migrations and the two deploy files against a database schema, twice, and compares schemas.
//
//   node scripts/verify-baseline.mjs              uses supabase/baseline/live-schema.sql (skips with exit 0 if absent)
//   node scripts/verify-baseline.mjs --synthetic  builds the best local approximation of production from the repo
//                                                 (docs/marketplace/schema-baseline.json + older migrations + seed rows)
//   node scripts/verify-baseline.mjs --file=path  use another schema dump
//
// What it checks (exit 1 on any failure):
//   1. supabase/deploy/seller-portal-all.sql, rate-limits.sql and office-queues.sql run clean on the base schema.
//   2. Running them a second time changes nothing (schema fingerprint identical, data counts identical).
//   3. The deploy file is exactly the 7 migrations in order: applying the migration files one by one gives the same schema.
//   4. The verify queries at the end of the deploy file return 0.
// Uses PGlite (node_modules/@electric-sql/pglite). No Docker, no network, never touches a real database.
import fs from "node:fs"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const args = process.argv.slice(2)
const synthetic = args.includes("--synthetic")
const fileArg = args.find((a) => a.startsWith("--file="))?.slice(7)
const dumpPath = fileArg ? fileArg : root + "supabase/baseline/live-schema.sql"
const read = (p) => fs.readFileSync(p.startsWith("/") ? p : root + p, "utf8")

const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
let trgm = null
try {
  trgm = (await import("@electric-sql/pglite/contrib/pg_trgm")).pg_trgm
} catch {
  /* optional: without it the discovery migration takes its "extension unavailable" branch */
}

const SELLER = [
  "20261016100000_merchants_foundation.sql",
  "20261016110000_ledger_fees_payouts.sql",
  "20261016120000_seller_notifications.sql",
  "20261016130000_reviews.sql",
  "20261016140000_order_messages.sql",
  "20261016150000_marketplace_analytics.sql",
  "20261016160000_discovery.sql",
]
const RATE = "20261017100000_rate_limits.sql"
const OFFICE = "20261017120000_office_queues.sql"
const older = fs.readdirSync(root + "supabase/migrations").sort().filter((f) => f < SELLER[0])

if (!synthetic && !fs.existsSync(dumpPath)) {
  console.log(`SKIP: ${dumpPath.replace(root, "")} not found. Capture it first (supabase/scripts/capture-live-schema.md),`)
  console.log("or run with --synthetic to test against the repo-derived approximation.")
  process.exit(0)
}

let failures = 0
const fail = (m) => { failures++; console.log("FAIL " + m) }
const ok = (m) => console.log("ok   " + m)

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------
/** Splits pg_dump output into statements, respecting quotes, dollar quotes and comments. */
function splitSql(sql) {
  const out = []
  let cur = "", i = 0, dollar = null
  while (i < sql.length) {
    const ch = sql[i], rest = sql.slice(i)
    if (dollar) {
      if (rest.startsWith(dollar)) { cur += dollar; i += dollar.length; dollar = null } else { cur += ch; i++ }
      continue
    }
    if (rest.startsWith("--")) { const e = sql.indexOf("\n", i); i = e < 0 ? sql.length : e + 1; continue }
    if (ch === "'") { let j = i + 1; while (j < sql.length && !(sql[j] === "'" && sql[j + 1] !== "'")) j += sql[j] === "'" ? 2 : 1; cur += sql.slice(i, j + 1); i = j + 1; continue }
    const m = /^\$[A-Za-z_0-9]*\$/.exec(rest)
    if (ch === "$" && m) { dollar = m[0]; cur += dollar; i += dollar.length; continue }
    if (ch === ";") { if (cur.trim()) out.push(cur.trim()); cur = ""; i++; continue }
    cur += ch; i++
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

/** Applies a pg_dump file statement by statement. Ownership, extension and psql-only lines are not needed locally. */
async function applyDump(db, sql) {
  const skipped = []
  let applied = 0
  for (const st of splitSql(sql.replace(/^\\.*$/gm, ""))) {
    if (/^(ALTER\s+\w+(\s+\w+)*\s+OWNER\s+TO|COMMENT\s+ON\s+EXTENSION|CREATE\s+EXTENSION|ALTER\s+DEFAULT\s+PRIVILEGES|SELECT\s+pg_catalog\.set_config|CREATE\s+PUBLICATION|ALTER\s+PUBLICATION)/i.test(st)) continue
    try { await db.exec(st); applied++ } catch (e) { skipped.push(`${st.slice(0, 90).replace(/\s+/g, " ")} -> ${e.message}`) }
  }
  return { applied, skipped }
}

async function fingerprint(db) {
  const q = async (sql) => (await db.query(sql)).rows.map((r) => Object.values(r).join(" | "))
  const parts = {
    columns: await q(`select table_name, column_name, data_type, coalesce(character_maximum_length::text,''), is_nullable, coalesce(column_default,'')
      from information_schema.columns where table_schema='public' order by 1,2`),
    constraints: await q(`select conrelid::regclass::text, conname, pg_get_constraintdef(oid) from pg_constraint
      where connamespace='public'::regnamespace order by 1,2`),
    indexes: await q(`select tablename, indexname, indexdef from pg_indexes where schemaname='public' order by 1,2`),
    triggers: await q(`select tgrelid::regclass::text, tgname, pg_get_triggerdef(oid) from pg_trigger where not tgisinternal order by 1,2`),
    functions: await q(`select p.proname, pg_get_function_identity_arguments(p.oid), pg_get_functiondef(p.oid) from pg_proc p
      where p.pronamespace='public'::regnamespace and p.prokind='f' order by 1,2`),
    views: await q(`select viewname, definition from pg_views where schemaname='public' order by 1`),
    rls: await q(`select relname, relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r' order by 1`),
    grants: await q(`select table_name, grantee, privilege_type from information_schema.role_table_grants
      where table_schema='public' and grantee in ('anon','authenticated','service_role') order by 1,2,3`),
    fnGrants: await q(`select p.proname, pg_get_function_identity_arguments(p.oid), r.rolname, has_function_privilege(r.oid, p.oid, 'execute')
      from pg_proc p cross join (select oid, rolname from pg_roles where rolname in ('anon','authenticated','service_role')) r
      where p.pronamespace='public'::regnamespace and p.prokind='f' order by 1,2,3`),
  }
  const counts = {}
  for (const t of (await db.query(`select relname from pg_class where relnamespace='public'::regnamespace and relkind='r' order by 1`)).rows)
    counts[t.relname] = Number((await db.query(`select count(*)::int c from "${t.relname}"`)).rows[0].c)
  return { parts, counts }
}

function compare(label, a, b) {
  let same = true
  for (const k of Object.keys(a.parts)) {
    const x = a.parts[k], y = b.parts[k]
    if (x.join("\n") === y.join("\n")) continue
    same = false
    const sx = new Set(x), sy = new Set(y)
    const onlyA = x.filter((l) => !sy.has(l)).slice(0, 3), onlyB = y.filter((l) => !sx.has(l)).slice(0, 3)
    fail(`${label}: ${k} differ. first only-left: ${JSON.stringify(onlyA).slice(0, 300)} first only-right: ${JSON.stringify(onlyB).slice(0, 300)}`)
  }
  for (const t of new Set([...Object.keys(a.counts), ...Object.keys(b.counts)]))
    if (a.counts[t] !== b.counts[t]) { same = false; fail(`${label}: row count of ${t} changed ${a.counts[t]} -> ${b.counts[t]}`) }
  if (same) ok(`${label}: schema and row counts identical`)
}

// ---------------------------------------------------------------------------------------------
// synthetic production approximation
// ---------------------------------------------------------------------------------------------
function ddlFromBaselineJson() {
  const j = JSON.parse(read("docs/marketplace/schema-baseline.json"))
  const known = new Set(Object.keys(j))
  const stubs = ["currencies", "recipients", "expert_service_schedules"]
  const typeOf = (p) => {
    const f = p.format || "text"
    if (f === "character varying") return p.maxLength ? `varchar(${p.maxLength})` : "varchar"
    return f
  }
  const order = ["users", "currencies", "recipients", "hub_vendors", "hub_products", "hub_carts", "hub_cart_items", "delivery_addresses",
    "transactions", "hub_order_items", "expert_profiles", "expert_services", "expert_service_schedules", "expert_service_slots", "expert_bookings", "payment_methods"]
  let sql = ""
  const emitted = new Set(stubs)
  const emit = (t) => {
    if (emitted.has(t) || !j[t]) return
    emitted.add(t)
    const d = j[t], req = new Set(d.required || [])
    const cols = Object.entries(d.properties).map(([c, p]) => {
      const pk = /Primary Key/.test(p.description || "")
      let s = `"${c}" ${typeOf(p)}`
      if (pk) s += " primary key"
      if (p.default !== undefined && p.default !== null) s += ` default ${/^[a-z_0-9.]+\(.*\)$|^now\(\)|^CURRENT_TIMESTAMP/.test(String(p.default)) ? p.default : `'${String(p.default).replace(/'/g, "''")}'`}`
      if (req.has(c) && !pk) s += " not null"
      return s
    })
    sql += `create table "${t}" (\n  ${cols.join(",\n  ")}\n);\n`
  }
  emit("users")
  sql += "create table currencies (code varchar(3) primary key, name text, symbol text, status text default 'active');\n" +
    "insert into currencies (code, name) select c, c from unnest(array['RUB','USD','EUR','CNY','NGN','GHS','KES','BRL','GBP']) c;\n" +
    "create table recipients (id uuid primary key default gen_random_uuid(), user_id uuid references users(id), name text);\n" +
    "create table expert_service_schedules (id uuid primary key default gen_random_uuid(), expert_service_id uuid, timezone text not null default 'UTC', window_start_date date not null default current_date, window_end_date date not null default current_date, slot_duration_minutes integer not null default 60, created_at timestamptz not null default now(), updated_at timestamptz not null default now());\n"
  for (const t of order) emit(t)
  for (const t of known) emit(t)
  // foreign keys after creation so order does not matter
  for (const [t, d] of Object.entries(j))
    for (const [c, p] of Object.entries(d.properties)) {
      const m = /Foreign Key to `(\w+)\.(\w+)`/.exec(p.description || "")
      if (m && (known.has(m[1]) || stubs.includes(m[1]))) sql += `alter table "${t}" add foreign key ("${c}") references "${m[1]}"("${m[2]}");\n`
    }
  sql += "alter table hub_cart_items add unique (cart_id, hub_product_id);\n"
  sql += "create table exchange_rates (id uuid primary key default gen_random_uuid(), status text, from_currency text, to_currency text, rate numeric, fee_type text, fee_amount numeric, updated_at timestamptz default now());\n"
  return sql
}

const SEED = `
insert into users (id, email, first_name, last_name) values
  ('11111111-1111-4111-8111-111111111111','a@example.com','A','A'), ('11111111-1111-4111-8111-222222222222','b@example.com','B','B');
-- vendors: published, unpublished, a duplicate (service line, slug) pair, a null-ish photo
insert into hub_vendors (id, service_line_slug, name, slug, is_published, photo_url) values
  ('aaaaaaaa-0000-4000-8000-000000000001','food','Mama T','mama-t',true,'https://x/p.png'),
  ('aaaaaaaa-0000-4000-8000-000000000002','food','Mama T copy','mama-t',false,null),
  ('aaaaaaaa-0000-4000-8000-000000000003','mart','Corner Shop','corner',true,null);
insert into hub_products (id, title, category, pricing_type, fixed_amount, fixed_currency, fulfillment_type, vendor_id, service_line_slug, status, stock_quantity) values
  ('bbbbbbbb-0000-4000-8000-000000000001','Jollof','Meals','fixed',1000,'RUB','online','aaaaaaaa-0000-4000-8000-000000000001','food','live',10),
  ('bbbbbbbb-0000-4000-8000-000000000002','Soap','Home','fixed',200,'RUB','online','aaaaaaaa-0000-4000-8000-000000000003','mart','live',5),
  ('bbbbbbbb-0000-4000-8000-000000000003','Orphan','Home','fixed',50,'RUB','online',null,'mart','draft',null);
-- experts: with and without slug, two with the same slug
insert into expert_profiles (id, display_name, is_published, capabilities, slug) values
  ('cccccccc-0000-4000-8000-000000000001','Dr A',true,'{}','dr-a'),
  ('cccccccc-0000-4000-8000-000000000002','Dr B',false,'{}',null),
  ('cccccccc-0000-4000-8000-000000000003','Dr A twin',true,'{}','dr-a');
insert into expert_services (id, expert_profile_id, title) values ('dddddddd-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000001','Consult');
-- two historical marketplace orders, one per line, quotes carrying vendorId / profileId
insert into transactions (id, transaction_id, user_id, send_amount, send_currency, receive_amount, receive_currency, exchange_rate, total_amount)
  values ('eeeeeeee-0000-4000-8000-000000000001','T1','11111111-1111-4111-8111-111111111111',1,'RUB',1,'RUB',1,1),
         ('eeeeeeee-0000-4000-8000-000000000002','T2','11111111-1111-4111-8111-111111111111',1,'RUB',1,'RUB',1,1),
         ('eeeeeeee-0000-4000-8000-000000000003','T3','11111111-1111-4111-8111-111111111111',1,'RUB',1,'RUB',1,1);
insert into marketplace_quotes (id, user_id, payload, expires_at) values
  ('ffffffff-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','{"vendorId":"aaaaaaaa-0000-4000-8000-000000000001"}', now()),
  ('ffffffff-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','{"profileId":"cccccccc-0000-4000-8000-000000000001"}', now()),
  ('ffffffff-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','{}', now());
insert into marketplace_orders (id, transaction_id, public_id, user_id, quote_id, line, fulfillment_mode, snapshot, payment_deadline, request_key, request_hash, payment_state, fulfillment_state) values
  ('99999999-0000-4000-8000-000000000001','eeeeeeee-0000-4000-8000-000000000001','CI-1','11111111-1111-4111-8111-111111111111','ffffffff-0000-4000-8000-000000000001','food','digital','{"totals":{"subtotal":1000,"deliveryFee":0,"productCurrency":"RUB"}}', now(),'k1','h1','paid','fulfilled'),
  ('99999999-0000-4000-8000-000000000002','eeeeeeee-0000-4000-8000-000000000002','CI-2','11111111-1111-4111-8111-111111111111','ffffffff-0000-4000-8000-000000000002','experts','online_appointment','{}', now(),'k2','h2','paid','awaiting_acceptance'),
  ('99999999-0000-4000-8000-000000000003','eeeeeeee-0000-4000-8000-000000000003','CI-3','11111111-1111-4111-8111-111111111111','ffffffff-0000-4000-8000-000000000003','mart','digital','{}', now(),'k3','h3','awaiting_payment','awaiting_payment');
`

async function buildBase() {
  const db = new PGlite(trgm ? { extensions: { pg_trgm: trgm } } : {})
  await db.exec(read("supabase/tests/supabase-prelude.sql"))
  if (synthetic) {
    await db.exec(ddlFromBaselineJson())
    for (const f of older) {
      try { await db.exec(read("supabase/migrations/" + f)); ok(`older migration ${f}`) } catch (e) { fail(`older migration ${f}: ${e.message}`) }
    }
    await db.exec(SEED)
  } else {
    const { applied, skipped } = await applyDump(db, read(dumpPath))
    console.log(`dump: ${applied} statements applied, ${skipped.length} skipped`)
    for (const s of skipped.slice(0, 15)) console.log("  skipped: " + s)
    const has = (await db.query("select to_regclass('public.marketplace_orders') is not null as o")).rows[0].o
    if (!has) {
      console.log("note: the dump has no marketplace_orders; applying the marketplace lifecycle migrations first (they must be applied live before the Seller file)")
      for (const f of older.filter((x) => /marketplace/.test(x))) await db.exec(read("supabase/migrations/" + f))
    }
  }
  return db
}

// ---------------------------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------------------------
console.log(synthetic ? "Mode: synthetic production approximation" : `Mode: schema dump ${dumpPath.replace(root, "")}`)
const deploy = read("supabase/deploy/seller-portal-all.sql")
const rate = read("supabase/deploy/rate-limits.sql")
const office = read("supabase/deploy/office-queues.sql")

process.on("uncaughtException", (e) => { console.log("ERROR: " + (e?.message || e)); process.exit(1) })
const dbA = await buildBase()
const base = await fingerprint(dbA)
// pre-checks at the top of the deploy file: 1 all true, 2 zero rows, 3 zero rows (first run), 4 informational
const pre = splitSql(deploy.slice(0, deploy.indexOf("-- ===== " + SELLER[0])))
const p1 = (await dbA.query(pre[0])).rows[0]
console.log("pre-check 1:", JSON.stringify(p1))
if (Object.values(p1).some((v) => v !== true)) fail("pre-check 1 has a false value")
const p2 = (await dbA.query(pre[1])).rows
if (p2.length) fail("pre-check 2: missing columns " + JSON.stringify(p2)); else ok("pre-check 2: no missing columns")
const p3 = (await dbA.query(pre[2])).rows
if (p3.length) fail("pre-check 3: names already exist before the first run " + JSON.stringify(p3)); else ok("pre-check 3: no name clashes")
console.log("pre-check 4:", JSON.stringify((await dbA.query(pre[3])).rows[0]))

const runDeploy = async (db, label) => {
  try { await db.exec(deploy); await db.exec(rate); await db.exec(office); ok(`${label}: seller-portal-all.sql + rate-limits.sql + office-queues.sql ran clean`) }
  catch (e) { fail(`${label}: ${e.message}`); throw e }
}
await runDeploy(dbA, "run 1")
const after1 = await fingerprint(dbA)
await runDeploy(dbA, "run 2")
const after2 = await fingerprint(dbA)
compare("second apply is a no-op", after1, after2)

// verify queries from the end of the deploy file
const verifyBlock = deploy.slice(deploy.indexOf("-- ===== verify"))
for (const st of splitSql(verifyBlock.split("\n").filter((l) => !l.startsWith("--")).join("\n"))) {
  const r = (await dbA.query(st)).rows[0]
  const v = Object.values(r)[0]
  if (Object.keys(r)[0].startsWith("info_")) console.log(`info: ${Object.keys(r)[0]} = ${v}`)
  else if (Number(v) === 0 || v === true) ok(`verify: ${Object.keys(r)[0]} = ${v}`)
  else fail(`verify: ${Object.keys(r)[0]} = ${v}`)
}

if (trgm) {
  const n = (await dbA.query("select count(*)::int n from pg_indexes where indexname like '%_trgm'")).rows[0].n
  if (n === 3) ok("pg_trgm search indexes created"); else fail(`expected 3 trigram indexes, found ${n}`)
}

// the deploy file must equal the migrations applied one by one
const dbB = await buildBase()
for (const f of [...SELLER, RATE, OFFICE]) await dbB.exec(read("supabase/migrations/" + f))
compare("deploy files vs migration files", after1, await fingerprint(dbB))

// the migrations themselves must also be re-runnable one by one
for (const f of [...SELLER, RATE, OFFICE]) await dbB.exec(read("supabase/migrations/" + f))
compare("migration files applied twice", after1, await fingerprint(dbB))

// optional demo data: run twice, remove, run again
if (synthetic) {
  const demo = read("supabase/deploy/demo-data.sql"), demoRm = read("supabase/deploy/demo-data-remove.sql")
  const q = async (sql) => (await dbA.query(sql)).rows
  const num = async (sql) => Number(Object.values((await q(sql))[0])[0])
  const counts = () => q(`select
    (select count(*) from hub_products where owner_team='demo' and service_line_slug='food')::int food,
    (select count(*) from hub_products p join hub_vendors v on v.id=p.vendor_id where p.owner_team='demo' and v.slug in ('demo-guangzhou-market','demo-latina-despensa'))::int mart,
    (select count(*) from expert_profiles where slug like 'demo-%')::int experts,
    (select count(*) from expert_services x join expert_profiles e on e.id=x.expert_profile_id where e.slug like 'demo-%')::int services,
    (select count(*) from expert_service_slots)::int slots,
    (select count(*) from marketplace_zones)::int zones, (select count(*) from hub_vendors)::int vendors, (select count(*) from merchants)::int merchants,
    (select count(*) from hub_products)::int products, (select count(*) from expert_service_schedules)::int schedules`).then((r) => r[0])
  // real Food stores the demo attaches to
  await dbA.exec("insert into hub_vendors (service_line_slug,name,slug,is_published) values ('food','La Cabana','lacabana',true),('food','Harvest Lane','harvest-lane',true)")
  const before = await counts()
  try {
    await dbA.exec(demo); const c1 = await counts()
    await dbA.exec(demo); const c2 = await counts()
    JSON.stringify(c1) === JSON.stringify(c2) ? ok("demo-data.sql second run adds nothing") : fail(`demo second run changed counts ${JSON.stringify(c1)} -> ${JSON.stringify(c2)}`)
    c1.food === 9 && c1.mart === 9 && c1.experts === 3 && c1.services === 3 && c1.slots > 0 ? ok(`demo counts ${JSON.stringify(c1)}`) : fail(`demo counts wrong ${JSON.stringify(c1)}`)
    const bad = await num(`select count(*) from expert_service_slots s where s.expert_service_id in (select id from expert_services where title in ('Immigration consultation (60 min)','Russian lesson (60 min)','Document translation check')) and not (
      extract(isodow from s.slot_start at time zone 'Europe/Moscow') between 1 and 5 and (s.slot_start at time zone 'Europe/Moscow')::time >= '10:00' and (s.slot_end at time zone 'Europe/Moscow')::time <= '16:00' and (s.slot_end - s.slot_start) = interval '60 minutes')`)
    bad === 0 ? ok("demo slots are weekdays 10:00-16:00 Moscow") : fail(`${bad} demo slots outside weekdays 10:00-16:00 Moscow`)
    await dbA.exec(demoRm); const c3 = await counts()
    const exp = { ...before }
    JSON.stringify(c3) === JSON.stringify(exp) ? ok("demo-data-remove.sql restores the original counts (real rows untouched)") : fail(`remove left ${JSON.stringify(c3)} expected ${JSON.stringify(exp)}`)
    await dbA.exec(demoRm); ok("demo-data-remove.sql is re-runnable")
    const pk = await q("select pickup_location from hub_vendors where slug='lacabana'")
    pk[0].pickup_location === null ? ok("pickup details reset") : fail("pickup details not reset")
    await dbA.exec(demo); const c4 = await counts()
    JSON.stringify(c4) === JSON.stringify(c1) ? ok("demo-data.sql again after remove matches first run") : fail(`demo rerun ${JSON.stringify(c4)} vs ${JSON.stringify(c1)}`)
    // remove must refuse when a real order references a demo product
    const pid = (await q("select id from hub_products where owner_team='demo' limit 1"))[0].id
    await dbA.exec(`update marketplace_orders set snapshot = '{"items":[{"productId":"${pid}"}]}' where public_id='CI-1'`)
    let refused = false
    try { await dbA.exec(demoRm) } catch (e) { refused = /Cannot remove demo data/.test(e.message); await dbA.exec("rollback") }
    refused ? ok("remove refuses when an order references a demo product") : fail("remove did not refuse for an order referencing a demo product")
    const c5 = await counts()
    JSON.stringify(c5) === JSON.stringify(c4) ? ok("refused remove changed nothing") : fail("refused remove changed data")
  } catch (e) { fail("demo data: " + e.message) }
}

console.log(failures ? `\n${failures} problem(s)` : "\nall checks passed")
process.exit(failures ? 1 : 0)

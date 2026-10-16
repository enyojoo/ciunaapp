#!/usr/bin/env node
// Regenerates supabase/deploy/seller-portal-all.sql (the 7 Seller migrations), supabase/deploy/rate-limits.sql and supabase/deploy/office-queues.sql
// from supabase/migrations. Never edit the deploy files by hand: edit the migrations, then run this.
//   node scripts/build-seller-deploy.mjs          write both files
//   node scripts/build-seller-deploy.mjs --check  exit 1 if a deploy file is out of date
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const MIG = root + "supabase/migrations/"
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

const header = `-- Ciuna Seller portal: all 7 new migrations in order. Paste into the Supabase SQL Editor and run.
-- BEFORE: take a backup (Dashboard > Database > Backups) and read the pre-check results below.
-- Safe to re-run: every part is its own transaction, every object is created only if missing, backfills only touch
-- rows that are still unlinked, and each part gives up after 5 seconds if it cannot get a table lock (nothing changed,
-- just run it again). If a part fails, earlier parts stay applied; fix the cause and run the whole file again.
-- Needs Postgres 15 or newer (nulls-not-distinct unique constraint, security_invoker view): the first pre-check shows this.
-- Verified by scripts/verify-baseline.mjs (see docs/build-plan/v1-sql-verification.md).


-- ===== pre-check 1: every value must be true before you run the rest =====
select
  to_regclass('public.hub_vendors') is not null as hub_vendors,
  to_regclass('public.hub_products') is not null as hub_products,
  to_regclass('public.expert_profiles') is not null as expert_profiles,
  to_regclass('public.expert_services') is not null as expert_services,
  to_regclass('public.marketplace_orders') is not null as marketplace_orders,
  to_regclass('public.marketplace_quotes') is not null as marketplace_quotes,
  to_regclass('public.users') is not null as users,
  current_setting('server_version_num')::int >= 150000 as postgres_15_or_newer;

-- ===== pre-check 2: columns the migrations read on existing tables. Must return ZERO rows =====
select req.tbl as table_name, req.col as missing_column
from (values
  ('users','id'),
  ('hub_vendors','id'), ('hub_vendors','service_line_slug'), ('hub_vendors','slug'), ('hub_vendors','name'), ('hub_vendors','is_published'), ('hub_vendors','photo_url'),
  ('hub_products','id'), ('hub_products','vendor_id'), ('hub_products','title'),
  ('expert_profiles','id'), ('expert_profiles','slug'), ('expert_profiles','display_name'), ('expert_profiles','is_published'), ('expert_profiles','image_url'),
  ('expert_services','id'),
  ('marketplace_quotes','id'), ('marketplace_quotes','payload'),
  ('marketplace_orders','id'), ('marketplace_orders','quote_id'), ('marketplace_orders','user_id'), ('marketplace_orders','line'), ('marketplace_orders','snapshot'),
  ('marketplace_orders','public_id'), ('marketplace_orders','payment_state'), ('marketplace_orders','fulfillment_state'), ('marketplace_orders','updated_at')
) as req(tbl, col)
left join information_schema.columns c on c.table_schema = 'public' and c.table_name = req.tbl and c.column_name = req.col
where c.column_name is null;

-- ===== pre-check 3: names this file creates that ALREADY exist. First run: expect ZERO rows. =====
-- (On a re-run after a successful run, every row is expected.) A table listed here that this file did not create means a
-- name clash with something older: stop and send the output back before running anything.
select 'table' as kind, c.relname as name
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'v', 'p') and c.relname in (
  'merchants','merchant_members','merchant_invites','merchant_applications','kyb_profiles','merchant_documents','merchant_payout_methods','audit_log',
  'fee_plans','fee_rules','marketplace_settings','ledger_accounts','ledger_txns','ledger_entries','ledger_balances','order_fees','merchant_earnings','payouts',
  'merchant_notification_prefs','telegram_links','telegram_link_tokens','seller_outbox','reviews','order_messages','favorites','rate_limit_hits')
union all
select 'column', c.table_name || '.' || c.column_name
from information_schema.columns c
where c.table_schema = 'public' and (c.table_name, c.column_name) in (
  ('hub_vendors','merchant_id'),('hub_products','merchant_id'),('expert_profiles','merchant_id'),('marketplace_orders','merchant_id'),
  ('hub_products','review_status'),('hub_products','review_note'),('hub_products','translations'),('hub_products','gallery'),
  ('expert_services','review_status'),('expert_services','review_note'),('expert_services','translations'),
  ('hub_vendors','translations'),('expert_profiles','translations'),('merchants','fee_plan_id'),
  ('hub_vendors','rating_avg'),('hub_vendors','rating_count'),('expert_profiles','rating_avg'),('expert_profiles','rating_count'))
order by 1, 2;

-- ===== pre-check 4: table sizes (informational; the backfills touch these rows once) =====
select
  (select count(*) from hub_vendors) as vendors,
  (select count(*) from hub_products) as products,
  (select count(*) from expert_profiles) as experts,
  (select count(*) from marketplace_orders) as orders;

`

const strip = (s) => s.trimEnd() + "\n"
let out = header
for (const f of SELLER) out += `\n-- ===== ${f} =====\n` + strip(fs.readFileSync(MIG + f, "utf8"))
out += `
-- ===== verify (run after; every row must say 0) =====
select count(*) as vendors_without_merchant from hub_vendors where merchant_id is null;
select count(*) as products_without_merchant from hub_products where merchant_id is null and vendor_id is not null;
select count(*) as experts_without_merchant from expert_profiles where merchant_id is null;
select count(*) as merchants_shared_by_several_vendors from (select merchant_id from hub_vendors group by merchant_id having count(*) > 1) s;
select count(*) as merchants_shared_by_several_experts from (select merchant_id from expert_profiles group by merchant_id having count(*) > 1) s;
select count(*) as orders_with_vendor_but_no_merchant from marketplace_orders o join marketplace_quotes q on q.id = o.quote_id
  where o.merchant_id is null and (nullif(q.payload->>'vendorId', '') is not null or nullif(q.payload->>'profileId', '') is not null);
-- informational (not required to be 0): products that never had a vendor stay without a merchant
select count(*) as info_products_without_vendor from hub_products where vendor_id is null;
`
const rate = strip(fs.readFileSync(MIG + RATE, "utf8"))
const rateOut = `-- Ciuna API rate limiting (table + function). Paste into the Supabase SQL Editor and run. Safe to re-run; new objects only.
-- Verified by scripts/verify-baseline.mjs. Verify after: select rate_limit_hit('test', 2, 60), rate_limit_hit('test', 2, 60), rate_limit_hit('test', 2, 60);  -- true, true, false
` + rate

const officeOut = `-- Ciuna Office queues: claim and SLA for merchant applications and listing review, rejection reason templates, saved views.
-- Paste into the Supabase SQL Editor and run AFTER seller-portal-all.sql. Safe to re-run; additive only; gives up after 5 s if it cannot lock a table.
-- Verified by scripts/verify-baseline.mjs. Verify after: select count(*) = 8 as templates from reason_templates; select value from marketplace_settings where key = 'office_sla';
` + strip(fs.readFileSync(MIG + OFFICE, "utf8"))

const targets = [
  [root + "supabase/deploy/seller-portal-all.sql", out],
  [root + "supabase/deploy/rate-limits.sql", rateOut],
  [root + "supabase/deploy/office-queues.sql", officeOut],
]
if (process.argv.includes("--check")) {
  let bad = 0
  for (const [p, c] of targets) if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== c) { console.log("out of date: " + p.replace(root, "")); bad++ }
  process.exit(bad ? 1 : 0)
}
for (const [p, c] of targets) { fs.writeFileSync(p, c); console.log("wrote " + p.replace(root, "")) }

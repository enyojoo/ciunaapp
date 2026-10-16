-- Ciuna Seller portal: all 7 new migrations in order. Paste into Supabase SQL Editor and run once.
-- Take a backup first (Dashboard > Database > Backups). Each part is its own transaction and safe to re-run.


-- ===== pre-check: these must all return true before you run the rest =====
select
  to_regclass('public.hub_vendors') is not null as hub_vendors,
  to_regclass('public.hub_products') is not null as hub_products,
  to_regclass('public.marketplace_orders') is not null as marketplace_orders,
  to_regclass('public.users') is not null as users;


-- ===== 20261016100000_merchants_foundation.sql =====
-- Ciuna Seller: merchant identity, membership, applications, KYB config, documents, payout methods, audit.
-- Additive. Same access model as the marketplace lifecycle: RLS on with no policies; every read/write goes
-- through the service-role API, which enforces membership (see api/lib/merchant/auth.ts).
begin;

-- ---------------------------------------------------------------------------------------------
-- merchants
-- ---------------------------------------------------------------------------------------------
create table if not exists merchants (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('store', 'expert')),
  slug text not null unique,
  display_name text not null,
  legal_name text,
  country text not null default 'RU' check (country ~ '^[A-Z]{2}$'),           -- where the business is based
  operating_country text not null default 'RU' check (operating_country ~ '^[A-Z]{2}$'), -- where it sells or delivers
  languages text[] not null default array['en'],
  default_language text not null default 'en' check (default_language in ('en','ru','fr','es','zh','pt')),
  default_currency text not null default 'RUB',
  status text not null default 'draft' check (status in ('draft','in_review','live','paused','rejected','suspended')),
  kyb_tier smallint not null default 0 check (kyb_tier between 0 and 2),         -- 0 none, 1 individual / self-employed, 2 registered business
  logo_url text,
  cover_url text,
  description jsonb not null default '{}',                                       -- {"en": "...", "ru": "..."}
  contact_email text,
  contact_phone text,
  website text,
  owner_team text not null default 'operations',
  draft_answers jsonb not null default '{}',                                      -- tier + KYB fields while drafting
  rejection_reason text,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  created_by uuid,
  office_managed boolean not null default false,                                  -- backfilled / owned by Office, no seller login
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (default_language = any (languages))
);
create index if not exists merchants_status_idx on merchants (status, type);

create table if not exists merchant_members (
  merchant_id uuid not null references merchants(id) on delete cascade,
  user_id uuid not null references users(id),
  role text not null check (role in ('owner','manager','staff','finance')),
  created_at timestamptz not null default now(),
  primary key (merchant_id, user_id)
);
create index if not exists merchant_members_user_idx on merchant_members (user_id);
-- exactly one owner per merchant that has any members
create unique index if not exists merchant_one_owner on merchant_members (merchant_id) where role = 'owner';

create table if not exists merchant_invites (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager','staff','finance')),
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists merchant_invites_email_idx on merchant_invites (lower(email));

-- ---------------------------------------------------------------------------------------------
-- applications, KYB configuration, documents
-- ---------------------------------------------------------------------------------------------
create table if not exists merchant_applications (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted','in_review','changes_requested','approved','rejected')),
  answers jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  assigned_to uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  decision_reason text,                       -- shown verbatim to the merchant
  internal_notes text
);
create index if not exists merchant_applications_queue_idx on merchant_applications (status, submitted_at);
create unique index if not exists merchant_one_open_application on merchant_applications (merchant_id)
  where status in ('submitted','in_review','changes_requested');

-- Country-driven KYB requirements. `country = '*'` is the fallback. Adding a country is a data change in Office.
create table if not exists kyb_profiles (
  id uuid primary key default gen_random_uuid(),
  country text not null check (country = '*' or country ~ '^[A-Z]{2}$'),
  merchant_type text not null check (merchant_type in ('store','expert','*')),
  tier smallint not null check (tier in (1, 2)),
  label text not null,
  requirements jsonb not null,                -- {"fields":[{"key","label","type","required"}],"documents":[{"kind","label","required","expires"}]}
  sanctions_check boolean not null default true,
  active boolean not null default true,
  unique (country, merchant_type, tier)
);

create table if not exists merchant_documents (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  kind text not null,
  file_path text not null,
  file_name text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  expires_at date,
  reviewed_by uuid,
  reviewed_at timestamptz,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists merchant_documents_merchant_idx on merchant_documents (merchant_id, status);

create table if not exists merchant_payout_methods (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  kind text not null check (kind in ('sbp','card','bank','ciuna_send')),
  currency text not null,
  label text not null,
  details_encrypted text not null,           -- encrypted by the API; never returned in full
  last4 text,
  recipient_id uuid,                          -- kind = ciuna_send: saved Send recipient
  verified boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists merchant_one_default_payout on merchant_payout_methods (merchant_id) where is_default;

-- ---------------------------------------------------------------------------------------------
-- audit log (append-only): admin, merchant and system actions
-- ---------------------------------------------------------------------------------------------
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  actor_kind text not null check (actor_kind in ('admin','merchant','system')),
  actor_id uuid,
  actor_role text,
  merchant_id uuid references merchants(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on audit_log (entity_type, entity_id, created_at desc);
create index if not exists audit_log_merchant_idx on audit_log (merchant_id, created_at desc);

create or replace function audit_log_immutable() returns trigger language plpgsql as $$
begin raise exception 'audit_log is append-only'; end $$;
drop trigger if exists audit_log_no_update on audit_log;
create trigger audit_log_no_update before update or delete on audit_log
  for each row execute function audit_log_immutable();

-- ---------------------------------------------------------------------------------------------
-- link existing catalog to merchants
-- ---------------------------------------------------------------------------------------------
alter table hub_vendors add column if not exists merchant_id uuid references merchants(id);
alter table hub_products add column if not exists merchant_id uuid references merchants(id);
alter table expert_profiles add column if not exists merchant_id uuid references merchants(id);
alter table hub_products add column if not exists review_status text not null default 'approved'
  check (review_status in ('approved','pending','rejected'));
alter table hub_products add column if not exists review_note text;
alter table expert_services add column if not exists review_status text not null default 'approved'
  check (review_status in ('approved','pending','rejected'));
alter table expert_services add column if not exists review_note text;
alter table hub_products add column if not exists translations jsonb not null default '{}';
alter table hub_products add column if not exists gallery jsonb not null default '[]';
alter table hub_vendors add column if not exists translations jsonb not null default '{}';
alter table expert_profiles add column if not exists translations jsonb not null default '{}';
alter table expert_services add column if not exists translations jsonb not null default '{}';
create index if not exists hub_vendors_merchant_idx on hub_vendors (merchant_id);
create index if not exists hub_products_merchant_idx on hub_products (merchant_id);
create index if not exists expert_profiles_merchant_idx on expert_profiles (merchant_id);

-- Backfill: every existing vendor / expert gets an Office-managed merchant so nothing breaks.
insert into merchants (type, slug, display_name, status, office_managed, logo_url)
select 'store', 'v-' || v.service_line_slug || '-' || v.slug, v.name,
       case when v.is_published then 'live' else 'draft' end, true, v.photo_url
from hub_vendors v
where v.merchant_id is null
on conflict (slug) do nothing;

update hub_vendors v set merchant_id = m.id
from merchants m
where v.merchant_id is null and m.slug = 'v-' || v.service_line_slug || '-' || v.slug;

insert into merchants (type, slug, display_name, status, office_managed, logo_url)
select 'expert', 'e-' || coalesce(p.slug, p.id::text), p.display_name,
       case when p.is_published then 'live' else 'draft' end, true, p.image_url
from expert_profiles p
where p.merchant_id is null
on conflict (slug) do nothing;

update expert_profiles p set merchant_id = m.id
from merchants m
where p.merchant_id is null and m.slug = 'e-' || coalesce(p.slug, p.id::text);

update hub_products p set merchant_id = v.merchant_id
from hub_vendors v
where p.merchant_id is null and p.vendor_id = v.id;

-- Orders carry the seller, so Seller can list "my orders" without parsing quotes.
alter table marketplace_orders add column if not exists merchant_id uuid references merchants(id);
create index if not exists marketplace_orders_merchant_idx on marketplace_orders (merchant_id, fulfillment_state, created_at desc);

create or replace function marketplace_order_set_merchant() returns trigger language plpgsql
security definer set search_path = public, pg_temp as $$
declare payload jsonb; mid uuid;
begin
  if new.merchant_id is not null then return new; end if;
  select q.payload into payload from marketplace_quotes q where q.id = new.quote_id;
  if payload ? 'vendorId' and nullif(payload->>'vendorId','') is not null then
    select merchant_id into mid from hub_vendors where id = (payload->>'vendorId')::uuid;
  elsif payload ? 'profileId' and nullif(payload->>'profileId','') is not null then
    select merchant_id into mid from expert_profiles where id = (payload->>'profileId')::uuid;
  end if;
  new.merchant_id := mid;
  return new;
end $$;
drop trigger if exists marketplace_orders_set_merchant on marketplace_orders;
create trigger marketplace_orders_set_merchant before insert on marketplace_orders
  for each row execute function marketplace_order_set_merchant();

update marketplace_orders o set merchant_id = coalesce(
  (select v.merchant_id from marketplace_quotes q join hub_vendors v on v.id = nullif(q.payload->>'vendorId','')::uuid where q.id = o.quote_id),
  (select p.merchant_id from marketplace_quotes q join expert_profiles p on p.id = nullif(q.payload->>'profileId','')::uuid where q.id = o.quote_id)
) where o.merchant_id is null;

-- ---------------------------------------------------------------------------------------------
-- seed KYB profiles (data, editable in Office)
-- ---------------------------------------------------------------------------------------------
insert into kyb_profiles (country, merchant_type, tier, label, requirements) values
('RU','*',1,'Self-employed or individual (Russia)','{"fields":[{"key":"inn","label":"INN","type":"text","required":true},{"key":"full_name","label":"Full name","type":"text","required":true}],"documents":[{"kind":"passport","label":"Passport or residence permit","required":true,"expires":true},{"kind":"self_employed_certificate","label":"Self-employed (NPD) certificate","required":false,"expires":false}]}'),
('RU','*',2,'Registered business (Russia)','{"fields":[{"key":"inn","label":"INN","type":"text","required":true},{"key":"ogrn","label":"OGRN / OGRNIP","type":"text","required":true},{"key":"legal_address","label":"Legal address","type":"text","required":true}],"documents":[{"kind":"registration_extract","label":"EGRUL / EGRIP extract","required":true,"expires":false},{"kind":"director_id","label":"Director ID","required":true,"expires":true}]}'),
('CN','*',2,'Registered business (China)','{"fields":[{"key":"uscc","label":"Unified Social Credit Code","type":"text","required":true},{"key":"legal_address","label":"Registered address","type":"text","required":true}],"documents":[{"kind":"business_licence","label":"Business licence","required":true,"expires":false},{"kind":"legal_rep_id","label":"Legal representative ID","required":true,"expires":true}]}'),
('NG','*',2,'Registered business (Nigeria)','{"fields":[{"key":"rc_number","label":"CAC RC number","type":"text","required":true},{"key":"legal_address","label":"Registered address","type":"text","required":true}],"documents":[{"kind":"cac_certificate","label":"CAC certificate","required":true,"expires":false},{"kind":"director_id","label":"Director ID","required":true,"expires":true}]}'),
('BR','*',2,'Registered business (Brazil)','{"fields":[{"key":"cnpj","label":"CNPJ","type":"text","required":true},{"key":"legal_address","label":"Registered address","type":"text","required":true}],"documents":[{"kind":"cnpj_card","label":"CNPJ card","required":true,"expires":false},{"kind":"director_id","label":"Director ID","required":true,"expires":true}]}'),
('*','*',1,'Individual (any country)','{"fields":[{"key":"full_name","label":"Full name","type":"text","required":true},{"key":"tax_id","label":"Tax ID (if any)","type":"text","required":false}],"documents":[{"kind":"passport","label":"Passport or national ID","required":true,"expires":true},{"kind":"proof_of_address","label":"Proof of address","required":true,"expires":false}]}'),
('*','*',2,'Registered business (any country)','{"fields":[{"key":"registration_number","label":"Registration number","type":"text","required":true},{"key":"legal_address","label":"Registered address","type":"text","required":true}],"documents":[{"kind":"registration_certificate","label":"Registration certificate","required":true,"expires":false},{"kind":"director_id","label":"Director ID","required":true,"expires":true}]}')
on conflict (country, merchant_type, tier) do nothing;

-- ---------------------------------------------------------------------------------------------
-- access: service role only
-- ---------------------------------------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['merchants','merchant_members','merchant_invites','merchant_applications','kyb_profiles','merchant_documents','merchant_payout_methods','audit_log'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from public, anon, authenticated', t);
    execute format('grant all on table %I to service_role', t);
  end loop;
end $$;
grant usage, select on sequence audit_log_id_seq to service_role;

commit;

-- ===== 20261016110000_ledger_fees_payouts.sql =====
-- Ciuna Seller money: fee rules/plans, double-entry ledger, per-order earnings, payouts.
-- Same access model as the other marketplace tables: RLS on, no policies, service-role only; every mutation
-- goes through the security-definer functions below so balances can never drift from entries.
begin;

-- ---------------------------------------------------------------------------------------------
-- fee engine configuration (edited in Office)
-- ---------------------------------------------------------------------------------------------
create table if not exists fee_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  monthly_fee numeric(14,2) not null default 0 check (monthly_fee >= 0),   -- subscription/listing fee: built, billing off at launch
  currency text not null default 'RUB' check (currency ~ '^[A-Z]{3}$'),
  commission_percent numeric(6,3) check (commission_percent between 0 and 100), -- overrides service-line/platform commission
  perks jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table merchants add column if not exists fee_plan_id uuid references fee_plans(id);

create table if not exists fee_rules (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('commission', 'payout')),
  scope text not null check (scope in ('platform', 'service_line', 'category', 'merchant')),
  service_line text check (service_line in ('food', 'mart', 'experts')),
  category text,
  merchant_id uuid references merchants(id) on delete cascade,
  percent numeric(6,3) check (percent between 0 and 100),
  fixed_amount numeric(14,2) check (fixed_amount >= 0),
  currency text check (currency ~ '^[A-Z]{3}$'),
  min_fee numeric(14,2) check (min_fee >= 0),
  max_fee numeric(14,2) check (max_fee >= 0),
  waive_above numeric(14,2) check (waive_above >= 0),                      -- payout fee waived at or above this amount
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (percent is not null or fixed_amount is not null),
  check (fixed_amount is null or currency is not null),
  check (min_fee is null or max_fee is null or min_fee <= max_fee),
  check (
    (scope = 'platform' and service_line is null and category is null and merchant_id is null) or
    (scope = 'service_line' and service_line is not null and category is null and merchant_id is null) or
    (scope = 'category' and service_line is not null and category is not null and merchant_id is null) or
    (scope = 'merchant' and merchant_id is not null)
  )
);
create index if not exists fee_rules_lookup_idx on fee_rules (kind, scope, active);

-- Placeholder launch commissions per service line. Office edits or replaces these; nothing is hardcoded in code.
insert into fee_rules (kind, scope, service_line, percent, note)
select 'commission', 'service_line', l, p, 'Launch default. Adjust in Office.'
from (values ('food', 8), ('mart', 6), ('experts', 12)) as v(l, p)
where not exists (select 1 from fee_rules where kind = 'commission' and scope = 'service_line' and service_line = v.l);

create table if not exists marketplace_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into marketplace_settings (key, value) values
  ('payout_hold_days', '2'),
  ('min_payout', '{"RUB": 1000, "USD": 15, "EUR": 15, "CNY": 100, "NGN": 20000, "GHS": 200, "KES": 2000, "BRL": 80}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------------------------
-- double-entry ledger (append-only)
-- ---------------------------------------------------------------------------------------------
create table if not exists ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id),
  kind text not null check (kind in ('merchant_pending', 'merchant_available', 'merchant_payout_hold', 'platform_funding', 'platform_fees', 'platform_payouts')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  check ((kind like 'merchant_%') = (merchant_id is not null)),
  unique nulls not distinct (merchant_id, kind, currency)
);

create table if not exists ledger_txns (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                 -- idempotency key
  kind text not null,
  order_id uuid,
  payout_id uuid,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists ledger_entries (
  id bigint generated always as identity primary key,
  txn_id uuid not null references ledger_txns(id),
  account_id uuid not null references ledger_accounts(id),
  amount numeric(18,2) not null check (amount <> 0),   -- merchant accounts: positive = owed to the merchant
  currency text not null,
  created_at timestamptz not null default now()
);
create index if not exists ledger_entries_account_idx on ledger_entries (account_id, id);
create index if not exists ledger_entries_txn_idx on ledger_entries (txn_id);

create or replace function ledger_immutable() returns trigger language plpgsql as $$
begin raise exception 'ledger is append-only'; end $$;
drop trigger if exists ledger_entries_immutable on ledger_entries;
create trigger ledger_entries_immutable before update or delete on ledger_entries for each row execute function ledger_immutable();
drop trigger if exists ledger_txns_immutable on ledger_txns;
create trigger ledger_txns_immutable before update or delete on ledger_txns for each row execute function ledger_immutable();

create or replace view ledger_balances with (security_invoker = true) as
select a.id as account_id, a.merchant_id, a.kind, a.currency, coalesce(sum(e.amount), 0)::numeric(18,2) as balance
from ledger_accounts a left join ledger_entries e on e.account_id = a.id
group by a.id;

-- ---------------------------------------------------------------------------------------------
-- earnings, order fee snapshots, payouts
-- ---------------------------------------------------------------------------------------------
create table if not exists order_fees (
  order_id uuid primary key references marketplace_orders(id),
  merchant_id uuid not null references merchants(id),
  currency text not null,
  subtotal numeric(14,2) not null,
  commission numeric(14,2) not null check (commission >= 0),
  snapshot jsonb not null,                 -- the rule that applied, so later edits never rewrite history
  created_at timestamptz not null default now()
);

create table if not exists merchant_earnings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references marketplace_orders(id),
  merchant_id uuid not null references merchants(id),
  currency text not null,
  subtotal numeric(14,2) not null,
  delivery_fee numeric(14,2) not null default 0,
  commission numeric(14,2) not null,
  net numeric(14,2) not null check (net >= 0),
  status text not null default 'pending' check (status in ('pending', 'available', 'reversed')),
  fulfilled_at timestamptz not null default now(),
  release_at timestamptz not null,
  released_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists merchant_earnings_merchant_idx on merchant_earnings (merchant_id, fulfilled_at desc);
create index if not exists merchant_earnings_release_idx on merchant_earnings (status, release_at);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id),
  method_id uuid not null references merchant_payout_methods(id),
  method_snapshot jsonb not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  amount numeric(14,2) not null check (amount > 0),
  fee numeric(14,2) not null default 0 check (fee >= 0),
  net numeric(14,2) not null check (net >= 0),
  status text not null default 'requested' check (status in ('requested', 'approved', 'paid', 'rejected', 'cancelled')),
  reference text,
  reason text,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  paid_at timestamptz
);
create index if not exists payouts_queue_idx on payouts (status, requested_at);
create index if not exists payouts_merchant_idx on payouts (merchant_id, requested_at desc);

-- ---------------------------------------------------------------------------------------------
-- functions
-- ---------------------------------------------------------------------------------------------
-- p_lines: [{"merchant_id": uuid|null, "kind": "...", "currency": "RUB", "amount": 12.34}, ...]; must sum to zero per currency.
create or replace function ledger_post(p_key text, p_kind text, p_lines jsonb, p_order uuid default null, p_payout uuid default null, p_memo text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare tid uuid; ln jsonb; acc uuid; bad numeric;
begin
  select id into tid from ledger_txns where key = p_key;
  if found then return tid; end if;
  select coalesce(max(abs(s)), 0) into bad from (
    select sum((l->>'amount')::numeric) as s from jsonb_array_elements(p_lines) l group by l->>'currency'
  ) t;
  if bad <> 0 then raise exception 'LEDGER_UNBALANCED'; end if;
  insert into ledger_txns (key, kind, order_id, payout_id, memo) values (p_key, p_kind, p_order, p_payout, p_memo) returning id into tid;
  for ln in select * from jsonb_array_elements(p_lines) loop
    if (ln->>'amount')::numeric = 0 then continue; end if;
    insert into ledger_accounts (merchant_id, kind, currency)
      values (nullif(ln->>'merchant_id', '')::uuid, ln->>'kind', ln->>'currency')
      on conflict (merchant_id, kind, currency) do nothing;
    select id into acc from ledger_accounts
      where merchant_id is not distinct from nullif(ln->>'merchant_id', '')::uuid and kind = ln->>'kind' and currency = ln->>'currency';
    insert into ledger_entries (txn_id, account_id, amount, currency) values (tid, acc, (ln->>'amount')::numeric, ln->>'currency');
  end loop;
  return tid;
end $$;

create or replace function ledger_balance(p_merchant uuid, p_kind text, p_currency text) returns numeric
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(sum(e.amount), 0) from ledger_entries e join ledger_accounts a on a.id = e.account_id
  where a.merchant_id = p_merchant and a.kind = p_kind and a.currency = p_currency
$$;

-- Records a fulfilled order's earnings once. Commission is computed by the API (fee rules) and passed in.
create or replace function earning_record(p_order uuid, p_commission numeric, p_snapshot jsonb, p_hold_days integer)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare o marketplace_orders; eid uuid; sub numeric; del numeric; cur text; net numeric;
begin
  select * into o from marketplace_orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.merchant_id is null then return null; end if;
  if o.fulfillment_state <> 'fulfilled' then raise exception 'ORDER_NOT_FULFILLED'; end if;
  select id into eid from merchant_earnings where order_id = p_order;
  if found then return eid; end if;
  sub := coalesce((o.snapshot #>> '{totals,subtotal}')::numeric, 0);
  del := coalesce((o.snapshot #>> '{totals,deliveryFee}')::numeric, 0);
  cur := coalesce(o.snapshot #>> '{totals,productCurrency}', o.snapshot #>> '{totals,payCurrency}');
  if cur is null then raise exception 'ORDER_CURRENCY_MISSING'; end if;
  if p_commission < 0 or p_commission > sub then raise exception 'COMMISSION_INVALID'; end if;
  net := sub + del - p_commission;
  insert into merchant_earnings (order_id, merchant_id, currency, subtotal, delivery_fee, commission, net, release_at)
    values (p_order, o.merchant_id, cur, sub, del, p_commission, net, now() + make_interval(days => greatest(p_hold_days, 0)))
    returning id into eid;
  insert into order_fees (order_id, merchant_id, currency, subtotal, commission, snapshot)
    values (p_order, o.merchant_id, cur, sub, p_commission, coalesce(p_snapshot, '{}')) on conflict (order_id) do nothing;
  perform ledger_post('earning:' || p_order::text, 'earning',
    jsonb_build_array(
      jsonb_build_object('merchant_id', null, 'kind', 'platform_funding', 'currency', cur, 'amount', -(sub + del)),
      jsonb_build_object('merchant_id', o.merchant_id, 'kind', 'merchant_pending', 'currency', cur, 'amount', net),
      jsonb_build_object('merchant_id', null, 'kind', 'platform_fees', 'currency', cur, 'amount', p_commission)),
    p_order, null, 'Order fulfilled');
  return eid;
end $$;

-- Moves earnings past their hold from pending to available. Safe to call repeatedly.
create or replace function earnings_release_due() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare e merchant_earnings; n integer := 0;
begin
  for e in select * from merchant_earnings where status = 'pending' and release_at <= now() order by release_at for update skip locked loop
    perform ledger_post('release:' || e.id::text, 'release',
      jsonb_build_array(
        jsonb_build_object('merchant_id', e.merchant_id, 'kind', 'merchant_pending', 'currency', e.currency, 'amount', -e.net),
        jsonb_build_object('merchant_id', e.merchant_id, 'kind', 'merchant_available', 'currency', e.currency, 'amount', e.net)),
      e.order_id, null, 'Hold ended');
    update merchant_earnings set status = 'available', released_at = now() where id = e.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Clawback after a post-fulfilment refund. May drive the merchant balance negative; Office decides how to recover.
create or replace function earning_reverse(p_order uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare e merchant_earnings; acct text;
begin
  select * into e from merchant_earnings where order_id = p_order for update;
  if not found or e.status = 'reversed' then return; end if;
  acct := case e.status when 'pending' then 'merchant_pending' else 'merchant_available' end;
  perform ledger_post('reverse:' || e.id::text, 'reversal',
    jsonb_build_array(
      jsonb_build_object('merchant_id', e.merchant_id, 'kind', acct, 'currency', e.currency, 'amount', -e.net),
      jsonb_build_object('merchant_id', null, 'kind', 'platform_fees', 'currency', e.currency, 'amount', -e.commission),
      jsonb_build_object('merchant_id', null, 'kind', 'platform_funding', 'currency', e.currency, 'amount', e.subtotal + e.delivery_fee)),
    p_order, null, coalesce(p_reason, 'Refund after fulfilment'));
  update merchant_earnings set status = 'reversed' where id = e.id;
end $$;

create or replace function payout_request(p_merchant uuid, p_method uuid, p_amount numeric, p_currency text, p_user uuid, p_min numeric, p_fee numeric)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare m merchant_payout_methods; pid uuid; avail numeric; open_n integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('payout:' || p_merchant::text, 0));
  select * into m from merchant_payout_methods where id = p_method and merchant_id = p_merchant;
  if not found then raise exception 'PAYOUT_METHOD_NOT_FOUND'; end if;
  if not m.verified then raise exception 'PAYOUT_METHOD_NOT_VERIFIED'; end if;
  if m.currency <> p_currency then raise exception 'PAYOUT_CURRENCY_MISMATCH'; end if;
  if p_amount <= 0 then raise exception 'AMOUNT_INVALID'; end if;
  if p_amount < p_min then raise exception 'BELOW_MINIMUM_PAYOUT'; end if;
  if p_fee < 0 or p_fee >= p_amount then raise exception 'PAYOUT_FEE_INVALID'; end if;
  select count(*) into open_n from payouts where merchant_id = p_merchant and status in ('requested', 'approved');
  if open_n >= 3 then raise exception 'TOO_MANY_OPEN_PAYOUTS'; end if;
  avail := ledger_balance(p_merchant, 'merchant_available', p_currency);
  if avail < p_amount then raise exception 'INSUFFICIENT_BALANCE'; end if;
  insert into payouts (merchant_id, method_id, method_snapshot, currency, amount, fee, net, requested_by)
    values (p_merchant, p_method, jsonb_build_object('kind', m.kind, 'label', m.label, 'last4', m.last4), p_currency, p_amount, p_fee, p_amount - p_fee, p_user)
    returning id into pid;
  perform ledger_post('payout-req:' || pid::text, 'payout_request',
    jsonb_build_array(
      jsonb_build_object('merchant_id', p_merchant, 'kind', 'merchant_available', 'currency', p_currency, 'amount', -p_amount),
      jsonb_build_object('merchant_id', p_merchant, 'kind', 'merchant_payout_hold', 'currency', p_currency, 'amount', p_amount)),
    null, pid, 'Payout requested');
  return pid;
end $$;

create or replace function payout_decide(p_payout uuid, p_action text, p_actor uuid, p_reference text default null, p_reason text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare p payouts;
begin
  select * into p from payouts where id = p_payout for update;
  if not found then raise exception 'PAYOUT_NOT_FOUND'; end if;
  if p_action = 'approve' then
    if p.status <> 'requested' then raise exception 'INVALID_TRANSITION'; end if;
    update payouts set status = 'approved', decided_by = p_actor, decided_at = now() where id = p.id;
  elsif p_action = 'paid' then
    if p.status not in ('requested', 'approved') then raise exception 'INVALID_TRANSITION'; end if;
    if length(trim(coalesce(p_reference, ''))) = 0 then raise exception 'REFERENCE_REQUIRED'; end if;
    perform ledger_post('payout-paid:' || p.id::text, 'payout_paid',
      jsonb_build_array(
        jsonb_build_object('merchant_id', p.merchant_id, 'kind', 'merchant_payout_hold', 'currency', p.currency, 'amount', -p.amount),
        jsonb_build_object('merchant_id', null, 'kind', 'platform_payouts', 'currency', p.currency, 'amount', p.amount - p.fee),
        jsonb_build_object('merchant_id', null, 'kind', 'platform_fees', 'currency', p.currency, 'amount', p.fee)),
      null, p.id, 'Payout paid');
    update payouts set status = 'paid', reference = trim(p_reference), decided_by = coalesce(decided_by, p_actor), decided_at = coalesce(decided_at, now()), paid_at = now() where id = p.id;
  elsif p_action in ('reject', 'cancel') then
    if p.status not in ('requested', 'approved') or (p_action = 'cancel' and p.status <> 'requested') then raise exception 'INVALID_TRANSITION'; end if;
    if p_action = 'reject' and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'REASON_REQUIRED'; end if;
    perform ledger_post('payout-back:' || p.id::text, 'payout_returned',
      jsonb_build_array(
        jsonb_build_object('merchant_id', p.merchant_id, 'kind', 'merchant_payout_hold', 'currency', p.currency, 'amount', -p.amount),
        jsonb_build_object('merchant_id', p.merchant_id, 'kind', 'merchant_available', 'currency', p.currency, 'amount', p.amount)),
      null, p.id, 'Payout ' || p_action);
    update payouts set status = case p_action when 'reject' then 'rejected' else 'cancelled' end, reason = p_reason, decided_by = p_actor, decided_at = now() where id = p.id;
  else
    raise exception 'INVALID_ACTION';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- access: service role only
-- ---------------------------------------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['fee_plans','fee_rules','marketplace_settings','ledger_accounts','ledger_txns','ledger_entries','order_fees','merchant_earnings','payouts'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from public, anon, authenticated', t);
    execute format('grant all on table %I to service_role', t);
  end loop;
  revoke all on ledger_balances from public, anon, authenticated;
  grant select on ledger_balances to service_role;
end $$;
grant usage, select on sequence ledger_entries_id_seq to service_role;
revoke execute on function ledger_post(text, text, jsonb, uuid, uuid, text), ledger_balance(uuid, text, text), earning_record(uuid, numeric, jsonb, integer),
  earnings_release_due(), earning_reverse(uuid, text), payout_request(uuid, uuid, numeric, text, uuid, numeric, numeric), payout_decide(uuid, text, uuid, text, text)
  from public, anon, authenticated;
grant execute on function ledger_post(text, text, jsonb, uuid, uuid, text), ledger_balance(uuid, text, text), earning_record(uuid, numeric, jsonb, integer),
  earnings_release_due(), earning_reverse(uuid, text), payout_request(uuid, uuid, numeric, text, uuid, numeric, numeric), payout_decide(uuid, text, uuid, text, text)
  to service_role;

commit;

-- ===== 20261016120000_seller_notifications.sql =====
-- Seller alerts: preferences, Telegram link, and an outbox the notification worker drains (email + Telegram).
-- Rows are created by database triggers so an alert is never lost if the API is busy; the worker sends them.
begin;

create table if not exists merchant_notification_prefs (
  user_id uuid not null references users(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,
  email boolean not null default true,
  telegram boolean not null default true,
  muted_kinds text[] not null default '{}',
  primary key (user_id, merchant_id)
);

create table if not exists telegram_links (
  user_id uuid primary key references users(id) on delete cascade,
  chat_id bigint not null unique,
  username text,
  linked_at timestamptz not null default now()
);

create table if not exists telegram_link_tokens (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '15 minutes',
  used_at timestamptz
);

create table if not exists seller_outbox (
  id bigint generated always as identity primary key,
  dedupe_key text not null unique,
  merchant_id uuid not null references merchants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  channel text not null check (channel in ('email', 'telegram')),
  kind text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists seller_outbox_due_idx on seller_outbox (status, run_after);

-- Who gets which alert: order and booking alerts go to people who handle orders; money alerts to owners and finance.
create or replace function seller_roles_for(p_kind text) returns text[] language sql immutable as $$
  select case
    when p_kind in ('order_new', 'booking_new') then array['owner', 'manager', 'staff']
    when p_kind = 'payout_update' then array['owner', 'finance']
    else array['owner', 'manager']
  end
$$;

create or replace function seller_notify(p_merchant uuid, p_kind text, p_payload jsonb, p_dedupe text)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare m record; n integer := 0; pref merchant_notification_prefs; linked boolean;
begin
  for m in select user_id from merchant_members where merchant_id = p_merchant and role = any (seller_roles_for(p_kind)) loop
    select * into pref from merchant_notification_prefs where user_id = m.user_id and merchant_id = p_merchant;
    if found and p_kind = any (pref.muted_kinds) then continue; end if;
    if coalesce(pref.email, true) then
      insert into seller_outbox (dedupe_key, merchant_id, user_id, channel, kind, payload)
        values (p_dedupe || ':email:' || m.user_id, p_merchant, m.user_id, 'email', p_kind, p_payload) on conflict (dedupe_key) do nothing;
      if found then n := n + 1; end if;
    end if;
    select exists (select 1 from telegram_links where user_id = m.user_id) into linked;
    if linked and coalesce(pref.telegram, true) then
      insert into seller_outbox (dedupe_key, merchant_id, user_id, channel, kind, payload)
        values (p_dedupe || ':telegram:' || m.user_id, p_merchant, m.user_id, 'telegram', p_kind, p_payload) on conflict (dedupe_key) do nothing;
      if found then n := n + 1; end if;
    end if;
  end loop;
  return n;
end $$;

-- A paid order reaches the seller: alert them.
create or replace function trg_order_new_alert() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.merchant_id is not null and new.fulfillment_state = 'awaiting_acceptance' and old.fulfillment_state is distinct from 'awaiting_acceptance' then
    perform seller_notify(new.merchant_id, case when new.line = 'experts' then 'booking_new' else 'order_new' end,
      jsonb_build_object('orderId', new.id, 'publicId', new.public_id, 'line', new.line, 'title', new.snapshot->>'title',
        'currency', new.snapshot#>>'{totals,productCurrency}', 'amount', new.snapshot#>>'{totals,subtotal}', 'slotStart', new.snapshot->>'slotStart'),
      'order-new:' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists order_new_alert on marketplace_orders;
create trigger order_new_alert after update of fulfillment_state on marketplace_orders for each row execute function trg_order_new_alert();

create or replace function trg_payout_alert() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status in ('approved', 'paid', 'rejected') and old.status is distinct from new.status then
    perform seller_notify(new.merchant_id, 'payout_update',
      jsonb_build_object('payoutId', new.id, 'status', new.status, 'currency', new.currency, 'amount', new.amount, 'net', new.net, 'reason', new.reason, 'reference', new.reference),
      'payout:' || new.id || ':' || new.status);
  end if;
  return new;
end $$;
drop trigger if exists payout_alert on payouts;
create trigger payout_alert after update of status on payouts for each row execute function trg_payout_alert();

create or replace function trg_merchant_status_alert() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- only Office decisions are worth an alert (approval, rejection, suspension), not a seller's own pause/resume
  if (old.status = 'in_review' and new.status in ('live', 'rejected')) or (new.status = 'suspended' and old.status in ('live', 'paused')) then
    perform seller_notify(new.id, 'merchant_status', jsonb_build_object('status', new.status, 'reason', new.rejection_reason, 'name', new.display_name), 'merchant:' || new.id || ':' || new.status || ':' || extract(epoch from now())::bigint);
  end if;
  return new;
end $$;
drop trigger if exists merchant_status_alert on merchants;
create trigger merchant_status_alert after update of status on merchants for each row execute function trg_merchant_status_alert();

-- Worker claims due rows; failed sends back off exponentially and give up after 6 attempts.
create or replace function seller_outbox_claim(p_limit integer) returns setof seller_outbox
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return query
  with due as (
    select id from seller_outbox where status in ('pending', 'sending') and run_after <= now() and attempts < 6
    order by id limit p_limit for update skip locked
  )
  update seller_outbox o set status = 'sending', attempts = o.attempts + 1, run_after = now() + make_interval(mins => (2 ^ o.attempts)::integer)
  from due where o.id = due.id returning o.*;
end $$;

create or replace function seller_outbox_done(p_id bigint, p_status text, p_error text default null) returns void
language sql security definer set search_path = public, pg_temp as $$
  update seller_outbox set status = p_status, last_error = p_error, sent_at = case when p_status = 'sent' then now() end,
    run_after = case when p_status in ('pending') then now() + interval '2 minutes' else run_after end
  where id = p_id
$$;

do $$ declare t text; begin
  foreach t in array array['merchant_notification_prefs', 'telegram_links', 'telegram_link_tokens', 'seller_outbox'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from public, anon, authenticated', t);
    execute format('grant all on table %I to service_role', t);
  end loop;
end $$;
grant usage, select on sequence seller_outbox_id_seq to service_role;
revoke execute on function seller_notify(uuid, text, jsonb, text), seller_outbox_claim(integer), seller_outbox_done(bigint, text, text) from public, anon, authenticated;
grant execute on function seller_notify(uuid, text, jsonb, text), seller_outbox_claim(integer), seller_outbox_done(bigint, text, text) to service_role;

commit;

-- ===== 20261016130000_reviews.sql =====
-- Ratings and reviews. One review per fulfilled order, written by the customer who placed it.
-- Same conventions as the merchant migrations: RLS on with no policies (service role only), additive,
-- security-definer functions with execute revoked from public roles.
begin;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references marketplace_orders(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,
  target_type text not null check (target_type in ('vendor', 'expert')),
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  language text,
  status text not null default 'published' check (status in ('published', 'hidden')),
  hidden_reason text,
  reply text check (reply is null or char_length(reply) <= 600),
  reply_at timestamptz,
  reply_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_merchant_idx on reviews (merchant_id, status, created_at desc);
create index if not exists reviews_status_idx on reviews (status, created_at desc);

alter table reviews enable row level security;
revoke all on table reviews from public, anon, authenticated;

alter table merchants add column if not exists rating_avg numeric(3, 2);
alter table merchants add column if not exists rating_count integer not null default 0;
alter table hub_vendors add column if not exists rating_avg numeric(3, 2);
alter table hub_vendors add column if not exists rating_count integer not null default 0;
alter table expert_profiles add column if not exists rating_avg numeric(3, 2);
alter table expert_profiles add column if not exists rating_count integer not null default 0;

-- Recompute from PUBLISHED reviews only, so hiding a review takes effect immediately.
create or replace function review_refresh_aggregates(p_merchant uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a numeric(3, 2); c integer;
begin
  select round(avg(rating)::numeric, 2), count(*)::integer into a, c
    from reviews where merchant_id = p_merchant and status = 'published';
  if c = 0 then a := null; end if;
  update merchants set rating_avg = a, rating_count = c where id = p_merchant;
  update hub_vendors set rating_avg = a, rating_count = c where merchant_id = p_merchant;
  update expert_profiles set rating_avg = a, rating_count = c where merchant_id = p_merchant;
end $$;

create or replace function trg_reviews_aggregate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    perform review_refresh_aggregates(old.merchant_id);
    return old;
  end if;
  perform review_refresh_aggregates(new.merchant_id);
  if tg_op = 'UPDATE' and old.merchant_id is distinct from new.merchant_id then
    perform review_refresh_aggregates(old.merchant_id);
  end if;
  return new;
end $$;

drop trigger if exists reviews_aggregate on reviews;
create trigger reviews_aggregate after insert or update of rating, status, merchant_id or delete on reviews
  for each row execute function trg_reviews_aggregate();

-- Customer writes a review (or edits it within 48 hours). Every rule lives here so no route can skip one.
create or replace function review_submit(p_order uuid, p_user uuid, p_rating integer, p_body text, p_lang text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare o marketplace_orders; r reviews; body_clean text; new_id uuid;
begin
  select * into o from marketplace_orders where id = p_order for share;
  if not found or o.user_id is distinct from p_user or o.fulfillment_state <> 'fulfilled' or o.merchant_id is null then
    raise exception 'REVIEW_NOT_ALLOWED';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'RATING_INVALID'; end if;
  body_clean := btrim(coalesce(p_body, ''));
  if char_length(body_clean) > 1000 then raise exception 'BODY_TOO_LONG'; end if;

  select * into r from reviews where order_id = p_order for update;
  if found then
    if now() - r.created_at > interval '48 hours' then raise exception 'ALREADY_REVIEWED'; end if;
    update reviews set rating = p_rating, body = body_clean, language = coalesce(nullif(btrim(p_lang), ''), language), updated_at = now()
      where id = r.id;
    return r.id;
  end if;

  if now() - o.updated_at > interval '30 days' then raise exception 'REVIEW_WINDOW_CLOSED'; end if;
  insert into reviews (order_id, user_id, merchant_id, target_type, rating, body, language)
    values (p_order, p_user, o.merchant_id, case when o.line = 'experts' then 'expert' else 'vendor' end,
            p_rating, body_clean, nullif(btrim(coalesce(p_lang, '')), ''))
    returning reviews.id into new_id;
  return new_id;
end $$;

-- Merchant replies once; the reply can be edited for 24 hours after it was first posted.
create or replace function review_reply(p_review uuid, p_merchant uuid, p_user uuid, p_reply text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r reviews; text_clean text;
begin
  select * into r from reviews where id = p_review and merchant_id = p_merchant and status = 'published' for update;
  if not found then raise exception 'REVIEW_NOT_FOUND'; end if;
  text_clean := btrim(coalesce(p_reply, ''));
  if text_clean = '' then raise exception 'REPLY_REQUIRED'; end if;
  if char_length(text_clean) > 600 then raise exception 'REPLY_TOO_LONG'; end if;
  if r.reply is not null and now() - r.reply_at > interval '24 hours' then raise exception 'REPLY_LOCKED'; end if;
  update reviews set reply = text_clean, reply_by = p_user,
    reply_at = case when r.reply is null then now() else r.reply_at end, updated_at = now()
    where id = r.id;
end $$;

-- Office hides or restores a review. Hiding needs a reason; aggregates follow through the trigger.
create or replace function review_moderate(p_review uuid, p_hide boolean, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r reviews; reason_clean text;
begin
  select * into r from reviews where id = p_review for update;
  if not found then raise exception 'REVIEW_NOT_FOUND'; end if;
  reason_clean := btrim(coalesce(p_reason, ''));
  if p_hide then
    if char_length(reason_clean) < 3 then raise exception 'REASON_REQUIRED'; end if;
    update reviews set status = 'hidden', hidden_reason = left(reason_clean, 500), updated_at = now() where id = r.id;
  else
    update reviews set status = 'published', hidden_reason = null, updated_at = now() where id = r.id;
  end if;
end $$;

-- Count of published reviews per star rating, as {"1": n, ... "5": n}.
create or replace function review_distribution(p_merchant uuid, p_target text default null) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_object_agg(s::text, coalesce(c.n, 0))
  from generate_series(1, 5) s
  left join (
    select rating, count(*)::integer n from reviews
    where merchant_id = p_merchant and status = 'published' and (p_target is null or target_type = p_target)
    group by rating
  ) c on c.rating = s
$$;

revoke execute on function
  review_refresh_aggregates(uuid), trg_reviews_aggregate(),
  review_submit(uuid, uuid, integer, text, text), review_reply(uuid, uuid, uuid, text),
  review_moderate(uuid, boolean, text), review_distribution(uuid, text)
  from public, anon, authenticated;

commit;

-- ===== 20261016140000_order_messages.sql =====
-- Order-scoped chat between a customer and the seller of a paid order.
-- Service role only (RLS on, no policies). Messages are append-only; the only change allowed is read_by_other_at.
begin;

create table if not exists order_messages (
  id bigint generated always as identity primary key,
  order_id uuid not null references marketplace_orders(id),
  merchant_id uuid not null references merchants(id),
  sender_kind text not null check (sender_kind in ('customer', 'merchant')),
  sender_id uuid not null,
  body text not null check (body = btrim(body) and char_length(body) between 1 and 2000),
  language text not null default 'en',
  created_at timestamptz not null default now(),
  read_by_other_at timestamptz
);
create index if not exists order_messages_order_idx on order_messages (order_id, id);
create index if not exists order_messages_merchant_idx on order_messages (merchant_id, created_at desc);
create index if not exists order_messages_unread_idx on order_messages (order_id, sender_kind) where read_by_other_at is null;

-- Append-only: no deletes, and updates may only stamp read_by_other_at (once).
create or replace function trg_order_messages_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'MESSAGES_APPEND_ONLY'; end if;
  if (to_jsonb(new) - 'read_by_other_at') is distinct from (to_jsonb(old) - 'read_by_other_at') or old.read_by_other_at is not null then
    raise exception 'MESSAGES_APPEND_ONLY';
  end if;
  return new;
end $$;
drop trigger if exists order_messages_guard on order_messages;
create trigger order_messages_guard before update or delete on order_messages for each row execute function trg_order_messages_guard();

-- Chat exists only for paid orders that belong to a merchant; it closes 14 days after the order is fulfilled or cancelled.
create or replace function message_chat_state(p_order uuid) returns text language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when o.id is null then 'missing'
    when o.merchant_id is null or o.payment_state not in ('paid', 'refund_pending', 'refunded') then 'unavailable'
    when o.fulfillment_state in ('fulfilled', 'cancelled') and o.updated_at < now() - interval '14 days' then 'closed'
    else 'open'
  end
  from (select 1) x left join marketplace_orders o on o.id = p_order
$$;

create or replace function message_send(p_order uuid, p_sender_kind text, p_sender uuid, p_body text, p_lang text default 'en')
returns order_messages language plpgsql security definer set search_path = public, pg_temp as $$
declare o marketplace_orders; b text := btrim(coalesce(p_body, '')); lang text := lower(coalesce(nullif(btrim(p_lang), ''), 'en')); m order_messages; st text; r text;
begin
  if p_sender_kind not in ('customer', 'merchant') then raise exception 'FORBIDDEN'; end if;
  select * into o from marketplace_orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  -- side enforcement: the customer must own the order; a seller must work for its merchant with a role that handles orders
  if p_sender_kind = 'customer' then
    if o.user_id is distinct from p_sender then raise exception 'ORDER_NOT_FOUND'; end if;
  else
    select role into r from merchant_members where merchant_id = o.merchant_id and user_id = p_sender;
    if r is null or r not in ('owner', 'manager', 'staff') then raise exception 'ORDER_NOT_FOUND'; end if;
  end if;
  st := message_chat_state(p_order);
  if st = 'unavailable' then raise exception 'CHAT_UNAVAILABLE'; end if;
  if st = 'closed' then raise exception 'CHAT_CLOSED'; end if;
  if b = '' then raise exception 'MESSAGE_EMPTY'; end if;
  if char_length(b) > 2000 then raise exception 'MESSAGE_TOO_LONG'; end if;
  if lang !~ '^[a-z]{2,3}(-[a-z0-9]{2,8})?$' then lang := 'en'; end if;
  if (select count(*) from order_messages where order_id = p_order and sender_kind = p_sender_kind and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'RATE_LIMITED';
  end if;
  insert into order_messages (order_id, merchant_id, sender_kind, sender_id, body, language)
    values (p_order, o.merchant_id, p_sender_kind, p_sender, b, lang) returning * into m;
  return m;
end $$;

-- Marks the other side's messages as read. The API checks that the reader belongs to the order first.
create or replace function messages_mark_read(p_order uuid, p_reader_kind text) returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if p_reader_kind not in ('customer', 'merchant') then raise exception 'FORBIDDEN'; end if;
  update order_messages set read_by_other_at = now() where order_id = p_order and sender_kind <> p_reader_kind and read_by_other_at is null;
  get diagnostics n = row_count;
  return n;
end $$;

-- Customer unread counts per order.
create or replace function messages_unread_customer(p_user uuid) returns table (order_id uuid, unread integer)
language sql stable security definer set search_path = public, pg_temp as $$
  select m.order_id, count(*)::integer from order_messages m join marketplace_orders o on o.id = m.order_id
  where o.user_id = p_user and m.sender_kind = 'merchant' and m.read_by_other_at is null group by m.order_id
$$;

-- Seller threads: one row per order with messages, newest activity first.
create or replace function messages_threads(p_merchant uuid, p_limit integer default 100) returns table (
  order_id uuid, public_id text, contact_name text, fulfillment_state text, chat_state text,
  last_body text, last_sender_kind text, last_at timestamptz, unread integer
) language sql stable security definer set search_path = public, pg_temp as $$
  select o.id, o.public_id, o.snapshot->>'contactName', o.fulfillment_state, message_chat_state(o.id),
    left(l.body, 400), l.sender_kind, l.created_at,
    (select count(*)::integer from order_messages u where u.order_id = o.id and u.sender_kind = 'customer' and u.read_by_other_at is null)
  from marketplace_orders o
  join lateral (select body, sender_kind, created_at from order_messages x where x.order_id = o.id order by x.id desc limit 1) l on true
  where o.merchant_id = p_merchant
  order by l.created_at desc
  limit greatest(least(p_limit, 200), 1)
$$;

-- Alert kind: a customer message reaches people who handle orders.
create or replace function seller_roles_for(p_kind text) returns text[] language sql immutable as $$
  select case
    when p_kind in ('order_new', 'booking_new', 'message_new') then array['owner', 'manager', 'staff']
    when p_kind = 'payout_update' then array['owner', 'finance']
    else array['owner', 'manager']
  end
$$;

-- One alert per order per 10 minutes, so a burst of messages does not flood email or Telegram.
create or replace function trg_message_alert() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare pub text;
begin
  if new.sender_kind = 'customer' then
    select public_id into pub from marketplace_orders where id = new.order_id;
    perform seller_notify(new.merchant_id, 'message_new',
      jsonb_build_object('orderId', new.order_id, 'publicId', pub, 'preview', left(new.body, 120)),
      'message:' || new.order_id || ':' || (extract(epoch from new.created_at)::bigint / 600));
  end if;
  return new;
end $$;
drop trigger if exists order_messages_alert on order_messages;
create trigger order_messages_alert after insert on order_messages for each row execute function trg_message_alert();

alter table order_messages enable row level security;
revoke all on table order_messages from public, anon, authenticated;
grant select on table order_messages to service_role;
revoke execute on function message_chat_state(uuid), message_send(uuid, text, uuid, text, text), messages_mark_read(uuid, text),
  messages_unread_customer(uuid), messages_threads(uuid, integer) from public, anon, authenticated;
grant execute on function message_chat_state(uuid), message_send(uuid, text, uuid, text, text), messages_mark_read(uuid, text),
  messages_unread_customer(uuid), messages_threads(uuid, integer) to service_role;

commit;

-- ===== 20261016150000_marketplace_analytics.sql =====
-- Marketplace health numbers for Office. One read-only function so the API stays thin and the logic is testable in SQL.
begin;

create or replace function marketplace_analytics(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare out jsonb;
begin
  if p_to <= p_from or p_to - p_from > interval '400 days' then raise exception 'RANGE_INVALID'; end if;
  select jsonb_build_object(
    'range', jsonb_build_object('from', p_from, 'to', p_to),
    -- gross merchandise value and Ciuna's take, per currency, by fulfilment date
    'money', coalesce((
      select jsonb_agg(jsonb_build_object('currency', currency, 'gmv', gmv, 'commission', commission, 'orders', n,
        'takeRate', case when items > 0 then round(commission / items * 100, 2) else 0 end) order by currency)
      from (
        select currency, sum(subtotal + delivery_fee) as gmv, sum(commission) as commission, count(*) as n, sum(subtotal) as items
        from merchant_earnings where fulfilled_at >= p_from and fulfilled_at < p_to and status <> 'reversed' group by currency
      ) s), '[]'::jsonb),
    -- paid orders by outcome, by line
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object('line', line, 'paid', paid, 'fulfilled', fulfilled, 'cancelled', cancelled, 'open', paid - fulfilled - cancelled,
        'fulfilmentRate', case when fulfilled + cancelled > 0 then round(fulfilled::numeric / (fulfilled + cancelled) * 100, 1) else null end,
        'cancellationRate', case when fulfilled + cancelled > 0 then round(cancelled::numeric / (fulfilled + cancelled) * 100, 1) else null end) order by line)
      from (
        select line, count(*) as paid,
          count(*) filter (where fulfillment_state = 'fulfilled') as fulfilled,
          count(*) filter (where fulfillment_state = 'cancelled') as cancelled
        from marketplace_orders where created_at >= p_from and created_at < p_to and merchant_id is not null
          and payment_state in ('paid', 'refund_pending', 'refunded') group by line
      ) s), '[]'::jsonb),
    'merchants', (select jsonb_build_object(
        'live', count(*) filter (where status = 'live' and not office_managed),
        'officeManaged', count(*) filter (where office_managed),
        'inReview', count(*) filter (where status = 'in_review'),
        'newInRange', count(*) filter (where created_at >= p_from and created_at < p_to and not office_managed),
        'approvedInRange', count(*) filter (where approved_at >= p_from and approved_at < p_to),
        'activeInRange', (select count(distinct merchant_id) from merchant_earnings where fulfilled_at >= p_from and fulfilled_at < p_to)
      ) from merchants),
    -- application pipeline
    'applications', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) as n from merchant_applications where submitted_at >= p_from and submitted_at < p_to group by status) s), '{}'::jsonb),
    'reviewMedianHours', (select round((percentile_cont(0.5) within group (order by extract(epoch from (reviewed_at - submitted_at)) / 3600))::numeric, 1) from merchant_applications where reviewed_at >= p_from and reviewed_at < p_to and reviewed_at is not null),
    -- how fast sellers respond: paid -> accepted, in minutes
    'acceptMedianMinutes', (select round((percentile_cont(0.5) within group (order by extract(epoch from (a.created_at - p.created_at)) / 60))::numeric, 1)
        from marketplace_events a join marketplace_events p on p.order_id = a.order_id and p.kind = 'paid'
        where a.kind = 'accept' and a.created_at >= p_from and a.created_at < p_to),
    -- activation: hours from approval to a merchant's first fulfilled order
    'timeToFirstOrderMedianHours', (select round((percentile_cont(0.5) within group (order by h))::numeric, 1) from (
        select extract(epoch from (min(e.fulfilled_at) - m.approved_at)) / 3600 as h
        from merchants m join merchant_earnings e on e.merchant_id = m.id
        where m.approved_at >= p_from and m.approved_at < p_to and not m.office_managed group by m.id, m.approved_at) s where h >= 0),
    'payouts', coalesce((select jsonb_agg(jsonb_build_object('status', status, 'currency', currency, 'count', n, 'amount', amt) order by status, currency)
        from (select status, currency, count(*) as n, sum(amount) as amt from payouts where requested_at >= p_from and requested_at < p_to group by status, currency) s), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'orders', n, 'currency', currency, 'gmv', gmv) order by d, currency)
        from (select (fulfilled_at at time zone 'UTC')::date as d, currency, count(*) as n, sum(subtotal + delivery_fee) as gmv
              from merchant_earnings where fulfilled_at >= p_from and fulfilled_at < p_to and status <> 'reversed' group by 1, 2) s), '[]'::jsonb),
    'topMerchants', coalesce((select jsonb_agg(jsonb_build_object('merchantId', id, 'name', display_name, 'currency', currency, 'gmv', gmv, 'orders', n) order by gmv desc)
        from (select m.id, m.display_name, e.currency, sum(e.subtotal + e.delivery_fee) as gmv, count(*) as n
              from merchant_earnings e join merchants m on m.id = e.merchant_id
              where e.fulfilled_at >= p_from and e.fulfilled_at < p_to and e.status <> 'reversed' group by m.id, m.display_name, e.currency order by gmv desc limit 10) s), '[]'::jsonb)
  ) into out;
  return out;
end $$;

revoke execute on function marketplace_analytics(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function marketplace_analytics(timestamptz, timestamptz) to service_role;

commit;

-- ===== 20261016160000_discovery.sql =====
-- Customer discovery: favourites and search indexes. Search itself is a plain ILIKE over trigram indexes for now;
-- the API hides the implementation so a dedicated engine can replace it later.
begin;

do $$ begin
  create extension if not exists pg_trgm;
exception when others then
  raise notice 'pg_trgm unavailable; search falls back to sequential ILIKE';
end $$;

create table if not exists favorites (
  user_id uuid not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('vendor', 'expert', 'product')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index if not exists favorites_target_idx on favorites (target_type, target_id);
alter table favorites enable row level security;
revoke all on table favorites from public, anon, authenticated;
grant all on table favorites to service_role;

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    create index if not exists hub_products_title_trgm on hub_products using gin (lower(title) gin_trgm_ops);
    create index if not exists hub_vendors_name_trgm on hub_vendors using gin (lower(name) gin_trgm_ops);
    create index if not exists expert_profiles_name_trgm on expert_profiles using gin (lower(display_name) gin_trgm_ops);
  end if;
end $$;

commit;

-- ===== verify (run after; results should be 0 / true) =====
select count(*) as vendors_without_merchant from hub_vendors where merchant_id is null;
select count(*) as products_without_merchant from hub_products where merchant_id is null;

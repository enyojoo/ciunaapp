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

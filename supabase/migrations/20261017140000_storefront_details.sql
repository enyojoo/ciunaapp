-- Storefront details for the customer app: opening hours and time zone, minimum order, delivery ETA, store cover,
-- verification tier, and the expert fields the profile and directory need (languages, time zone, credentials,
-- years of practice, verified flag). Additive only. The merchant row stays the source of truth where one exists:
-- time zone, cover, languages and tier are mirrored from `merchants` by the API (syncPublication / syncStorefrontFields).
begin;
-- Fail fast instead of queueing behind a long-running transaction.
set local lock_timeout = '5s';

alter table merchants add column if not exists time_zone text not null default 'UTC' check (length(time_zone) between 3 and 64);

-- opening_hours: {"mon":[{"open":"09:00","close":"21:00"}], ...}. A day that is missing is closed.
-- An empty object means the store has not set hours: it is never shown as closed.
alter table hub_vendors
  add column if not exists opening_hours jsonb not null default '{}',
  add column if not exists time_zone text not null default 'UTC' check (length(time_zone) between 3 and 64),
  add column if not exists min_order_amount numeric(14,2) check (min_order_amount is null or min_order_amount >= 0),
  add column if not exists min_order_currency text check (min_order_currency is null or min_order_currency ~ '^[A-Z]{3}$'),
  add column if not exists cover_url text,
  add column if not exists verification_tier smallint not null default 0 check (verification_tier between 0 and 2);

alter table marketplace_zones
  add column if not exists eta_minutes integer check (eta_minutes is null or eta_minutes between 1 and 1440);

alter table expert_profiles
  add column if not exists languages text[] not null default '{}',
  add column if not exists time_zone text not null default 'UTC' check (length(time_zone) between 3 and 64),
  add column if not exists credentials jsonb not null default '[]',
  add column if not exists years_experience smallint check (years_experience is null or years_experience between 0 and 80),
  add column if not exists is_verified boolean not null default false,
  add column if not exists verification_tier smallint not null default 0 check (verification_tier between 0 and 2);

-- Backfill the mirrored fields for rows that already have a merchant.
update hub_vendors v
  set cover_url = m.cover_url, time_zone = m.time_zone, verification_tier = m.kyb_tier
  from merchants m where m.id = v.merchant_id;
update expert_profiles e
  set languages = m.languages, time_zone = m.time_zone, verification_tier = m.kyb_tier,
      is_verified = (m.status = 'live' and m.kyb_tier >= 1)
  from merchants m where m.id = e.merchant_id;

commit;

-- Office queues: claim and SLA for merchant applications and listing review, reason templates, saved views.
-- Additive and idempotent. Service-role access only (RLS on, no policies). Needs 20261016100000_merchants_foundation.sql and
-- 20261016110000_ledger_fees_payouts.sql (marketplace_settings) applied first.
begin;
set local lock_timeout = '5s';

-- ---------------------------------------------------------------------------------------------
-- merchant applications: when the current owner claimed it
-- ---------------------------------------------------------------------------------------------
alter table merchant_applications add column if not exists claimed_at timestamptz;

-- ---------------------------------------------------------------------------------------------
-- listing review: waiting time, owner, who decided and why
-- ---------------------------------------------------------------------------------------------
alter table hub_products add column if not exists review_requested_at timestamptz;
alter table hub_products add column if not exists review_assigned_to uuid;
alter table hub_products add column if not exists review_claimed_at timestamptz;
alter table hub_products add column if not exists reviewed_by uuid;
alter table hub_products add column if not exists reviewed_at timestamptz;
alter table hub_products add column if not exists review_reason_key text;

-- Existing pending rows start their clock now-ish (their last change), never null.
update hub_products set review_requested_at = coalesce(updated_at, created_at, now())
  where review_status = 'pending' and review_requested_at is null;

create index if not exists hub_products_review_queue_idx on hub_products (review_status, review_requested_at)
  where review_status = 'pending';

-- Entering review starts the clock and clears any old owner; leaving review clears the owner.
create or replace function hub_products_review_stamp() returns trigger language plpgsql as $$
declare changed boolean;
begin
  if tg_op = 'INSERT' then changed := true; else changed := old.review_status is distinct from new.review_status; end if;
  if changed then
    new.review_assigned_to := null;
    new.review_claimed_at := null;
    if new.review_status = 'pending' then new.review_requested_at := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists hub_products_review_stamp on hub_products;
create trigger hub_products_review_stamp before insert or update of review_status on hub_products
  for each row execute function hub_products_review_stamp();

-- ---------------------------------------------------------------------------------------------
-- SLA targets (Office-editable) in marketplace_settings. Hours, except where named.
-- ---------------------------------------------------------------------------------------------
insert into marketplace_settings (key, value) values
  ('office_sla', '{"merchant_application": 24, "listing_review": 12, "payout": 48, "kyc_business_hours": 4, "support_business_days": 1, "business_start_hour": 9, "business_end_hour": 18}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------------------------
-- reason templates (rejections). `key` is the stable localisable key; `translations` holds {"ru": "...", ...}; `text` is English.
-- ---------------------------------------------------------------------------------------------
create table if not exists reason_templates (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  key text not null,
  label text not null,
  text text not null,
  translations jsonb not null default '{}',
  needs_message boolean not null default false,
  sort smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (scope, key)
);
alter table reason_templates enable row level security;

insert into reason_templates (scope, key, label, text, needs_message, sort) values
  ('listing_rejection', 'prohibited_item', 'Prohibited item', 'This item is not allowed on Ciuna. Remove it or replace it with a permitted item.', false, 1),
  ('listing_rejection', 'unclear_photos', 'Unclear photos', 'The photos are unclear. Upload sharp, well-lit photos of the actual item.', false, 2),
  ('listing_rejection', 'wrong_category', 'Wrong category', 'The listing is in the wrong category. Choose the category that fits the item.', false, 3),
  ('listing_rejection', 'missing_information', 'Missing information', 'The listing is missing information buyers need. Complete the description and details.', false, 4),
  ('listing_rejection', 'misleading', 'Price or description misleading', 'The price or description is misleading. Make them match what the buyer receives.', false, 5),
  ('listing_rejection', 'contact_details', 'Contact details in listing', 'The listing contains contact details. Remove them; buyers reach you through Ciuna.', false, 6),
  ('listing_rejection', 'duplicate', 'Duplicate listing', 'This duplicates another listing. Keep one and archive the other.', false, 7),
  ('listing_rejection', 'other', 'Other', 'Other reason.', true, 8)
on conflict (scope, key) do nothing;

-- ---------------------------------------------------------------------------------------------
-- saved views (filters per user and screen)
-- ---------------------------------------------------------------------------------------------
create table if not exists office_saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  scope text not null check (scope in ('merchants', 'payouts', 'audit', 'listings')),
  name text not null check (char_length(name) between 1 and 60),
  filters jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, scope, name)
);
create index if not exists office_saved_views_user_idx on office_saved_views (user_id, scope);
alter table office_saved_views enable row level security;

-- ---------------------------------------------------------------------------------------------
-- claim / release, atomic. Two admins claiming at once: the second gets {"ok": false, "code": "CLAIMED"} with the owner.
-- p_kind: 'merchant' (the open application of merchant p_id) or 'listing' (hub_products row p_id, in review).
-- p_force: take over or release someone else's claim (the API passes it for super_admin only).
-- ---------------------------------------------------------------------------------------------
create or replace function office_claim(p_kind text, p_id uuid, p_admin uuid, p_release boolean default false, p_force boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare rid uuid; cur uuid; claimed timestamptz;
begin
  if p_kind = 'merchant' then
    select id, assigned_to, claimed_at into rid, cur, claimed from merchant_applications
      where merchant_id = p_id and status in ('submitted', 'in_review') order by submitted_at desc limit 1 for update;
  elsif p_kind = 'listing' then
    select id, review_assigned_to, review_claimed_at into rid, cur, claimed from hub_products
      where id = p_id and review_status = 'pending' for update;
  else
    return jsonb_build_object('ok', false, 'code', 'INVALID_KIND');
  end if;
  if rid is null then return jsonb_build_object('ok', false, 'code', 'NOT_FOUND'); end if;

  if cur is not null and cur <> p_admin and not p_force then
    return jsonb_build_object('ok', false, 'code', 'CLAIMED', 'owner', cur, 'claimed_at', claimed);
  end if;

  if p_release then
    if p_kind = 'merchant' then update merchant_applications set assigned_to = null, claimed_at = null where id = rid;
    else update hub_products set review_assigned_to = null, review_claimed_at = null where id = rid; end if;
    return jsonb_build_object('ok', true, 'owner', null);
  end if;

  if cur = p_admin then return jsonb_build_object('ok', true, 'owner', cur, 'claimed_at', claimed); end if;
  if p_kind = 'merchant' then update merchant_applications set assigned_to = p_admin, claimed_at = now() where id = rid;
  else update hub_products set review_assigned_to = p_admin, review_claimed_at = now() where id = rid; end if;
  return jsonb_build_object('ok', true, 'owner', p_admin, 'claimed_at', now());
end $$;

revoke all on function office_claim(text, uuid, uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function office_claim(text, uuid, uuid, boolean, boolean) to service_role;

commit;

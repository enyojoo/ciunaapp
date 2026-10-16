-- Seller alerts: preferences, Telegram link, and an outbox the notification worker drains (email + Telegram).
-- Rows are created by database triggers so an alert is never lost if the API is busy; the worker sends them.
begin;
-- Fail fast instead of queueing behind a long-running transaction (a queued ALTER blocks every later query on that table).
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

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

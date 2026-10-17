-- Send limits per verification level, set by Office compliance. There are no default rows: until a level has a row
-- there is no limit for it, and the app shows no amounts (nothing here is hard-coded).
--   Level 1 = email and phone, level 2 = identity approved, level 3 = identity and address approved.
-- Service role only (RLS on, no policies). Usage counts Send transfers in the limit's currency this calendar month (UTC),
-- skipping failed, cancelled, rejected and refunded ones.
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

create table if not exists send_limits (
  level smallint primary key check (level between 1 and 3),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  monthly_amount numeric(14, 2) not null check (monthly_amount > 0),
  min_per_transfer numeric(14, 2) check (min_per_transfer is null or min_per_transfer >= 0),
  max_per_transfer numeric(14, 2) check (max_per_transfer is null or max_per_transfer > 0),
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (max_per_transfer is null or min_per_transfer is null or max_per_transfer >= min_per_transfer)
);

create or replace function send_usage(p_user uuid, p_currency text, p_since timestamptz)
returns numeric language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(sum(send_amount), 0) from transactions
  where user_id = p_user and transaction_source = 'send' and send_currency = p_currency and created_at >= p_since
    and coalesce(status, 'pending') not in ('failed', 'cancelled', 'rejected', 'refunded')
$$;

alter table send_limits enable row level security;
revoke all on table send_limits from public, anon, authenticated;
grant all on table send_limits to service_role;
revoke execute on function send_usage(uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function send_usage(uuid, text, timestamptz) to service_role;

commit;

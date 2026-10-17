-- Account deletion. A customer asks to delete: the account is disabled at once and personal data is removed after a
-- waiting period (default 30 days; Office can restore it before then). Transactions and ID checks (KYC) are kept for
-- legal record keeping; the user row is de-identified. Service role only (RLS on, no policies).
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

alter table users add column if not exists deleted_at timestamptz;

create table if not exists account_deletions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id),
  status text not null default 'requested' check (status in ('requested', 'restored', 'completed')),
  reason text check (reason is null or char_length(reason) <= 500),
  requested_at timestamptz not null default now(),
  purge_after timestamptz not null,
  completed_at timestamptz
);
create index if not exists account_deletions_due_idx on account_deletions (purge_after) where status = 'requested';
alter table account_deletions enable row level security;
revoke all on table account_deletions from public, anon, authenticated;
grant all on table account_deletions to service_role;

-- What stops a deletion right now: orders still in progress, transfers not finished, refunds not paid out.
create or replace function account_deletion_blockers(p_user uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'orders', (select count(*) from marketplace_orders where user_id = p_user and fulfillment_state not in ('fulfilled', 'cancelled') and payment_state not in ('expired', 'refunded')),
    'transfers', (select count(*) from transactions where user_id = p_user and status in ('pending', 'processing') and coalesce(transaction_source, '') <> 'hub'),
    'refunds', (select count(*) from marketplace_orders where user_id = p_user and payment_state = 'refund_pending')
  );
$$;

-- Ask for deletion. Returns { ok: false, blockers } when something is still in progress, else { ok: true, purge_after }.
create or replace function account_request_deletion(p_user uuid, p_reason text default null, p_days int default 30) returns jsonb
language plpgsql security definer set search_path = public as $$
declare b jsonb; due timestamptz;
begin
  perform 1 from users where id = p_user for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'USER_NOT_FOUND'); end if;
  b := account_deletion_blockers(p_user);
  if (b->>'orders')::int + (b->>'transfers')::int + (b->>'refunds')::int > 0 then
    return jsonb_build_object('ok', false, 'blockers', b);
  end if;
  due := now() + make_interval(days => greatest(p_days, 0));
  insert into account_deletions (user_id, reason, purge_after) values (p_user, left(p_reason, 500), due)
  on conflict (user_id) do update set status = 'requested', reason = excluded.reason, requested_at = now(), purge_after = excluded.purge_after, completed_at = null
    where account_deletions.status <> 'completed';
  update users set deleted_at = now() where id = p_user;
  delete from push_tokens where user_id = p_user;
  return jsonb_build_object('ok', true, 'purge_after', due);
end $$;

-- Office puts the account back before the waiting period ends.
create or replace function account_restore(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update account_deletions set status = 'restored' where user_id = p_user and status = 'requested';
  if not found then return false; end if;
  update users set deleted_at = null where id = p_user;
  return true;
end $$;

-- Remove personal data for requests past their date. Returns the user ids so the API can remove the sign-in too.
create or replace function account_purge_due(p_limit int default 20) returns setof uuid
language plpgsql security definer set search_path = public as $$
declare r record; t text;
begin
  for r in select user_id from account_deletions where status = 'requested' and purge_after <= now() order by purge_after limit p_limit for update skip locked loop
    foreach t in array array['recipients', 'favorites', 'push_tokens'] loop
      if to_regclass('public.' || t) is not null then execute format('delete from %I where user_id = $1', t) using r.user_id; end if;
    end loop;
    update users set email = 'deleted+' || r.user_id || '@deleted.invalid', first_name = 'Deleted', last_name = 'user', phone = null, avatar_url = null, deleted_at = coalesce(deleted_at, now()) where id = r.user_id;
    update account_deletions set status = 'completed', completed_at = now() where user_id = r.user_id;
    return next r.user_id;
  end loop;
end $$;
revoke all on function account_deletion_blockers(uuid), account_request_deletion(uuid, text, int), account_restore(uuid), account_purge_due(int) from public, anon, authenticated;
grant execute on function account_deletion_blockers(uuid), account_request_deletion(uuid, text, int), account_restore(uuid), account_purge_due(int) to service_role;

commit;

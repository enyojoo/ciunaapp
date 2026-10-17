-- Payment window for Send transfers paid online: a deadline on every such transfer, a customer "cancel transfer" and an
-- automatic cancel when the window closes unpaid. Service role only (functions revoked from everyone else).
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

alter table transactions add column if not exists payment_expires_at timestamptz;

-- 15 minutes to pay, counted from the moment the transfer is created. Marketplace orders have their own deadline; manual
-- bank transfers (receipt upload) are not given one.
create or replace function set_payment_expiry() returns trigger
language plpgsql as $$
begin
  if new.payment_expires_at is null and coalesce(new.transaction_source, 'send') <> 'hub' and new.payment_provider in ('bitbanker', 'yookassa') then
    new.payment_expires_at := coalesce(new.created_at, now()) + interval '15 minutes';
  end if;
  return new;
end $$;
drop trigger if exists transactions_payment_expiry on transactions;
create trigger transactions_payment_expiry before insert on transactions for each row execute function set_payment_expiry();

-- Cancel one transfer for its owner while it is still waiting for payment. Returns { ok } or { ok: false, error }.
create or replace function cancel_transfer(p_user uuid, p_transaction text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t record;
begin
  select * into t from transactions where upper(transaction_id) = upper(p_transaction) and user_id = p_user for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'TRANSFER_NOT_FOUND'); end if;
  if coalesce(t.transaction_source, 'send') = 'hub' then return jsonb_build_object('ok', false, 'error', 'NOT_A_TRANSFER'); end if;
  if t.status = 'cancelled' then return jsonb_build_object('ok', true, 'already', true); end if;
  if t.status <> 'pending' or coalesce(t.gateway_status, '') in ('paid', 'processing', 'succeeded', 'confirmed') then
    return jsonb_build_object('ok', false, 'error', 'TRANSFER_NOT_CANCELLABLE');
  end if;
  update transactions set status = 'cancelled', updated_at = now() where id = t.id;
  return jsonb_build_object('ok', true);
end $$;

-- Cancel transfers whose payment window closed with nothing paid. Returns their ids.
create or replace function expire_stale_transfers(p_limit int default 100) returns setof uuid
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select id from transactions
    where status = 'pending' and payment_expires_at is not null and payment_expires_at < now()
      and coalesce(gateway_status, '') not in ('paid', 'processing', 'succeeded', 'confirmed')
    order by payment_expires_at limit p_limit for update skip locked
  loop
    update transactions set status = 'cancelled', updated_at = now() where id = r.id;
    return next r.id;
  end loop;
end $$;

revoke all on function cancel_transfer(uuid, text), expire_stale_transfers(int) from public, anon, authenticated;
grant execute on function cancel_transfer(uuid, text), expire_stale_transfers(int) to service_role;

commit;

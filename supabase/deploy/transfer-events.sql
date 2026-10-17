-- Transfer events and the transfers notification switch. Paste into the Supabase SQL Editor. Safe to re-run; needs push-preferences.sql applied first.
-- Same content as supabase/migrations/20261019130000_transfer_events.sql.
-- Transfer events: every status a transfer goes through, with its time. Feeds the times on the transfer screen and the
-- transfer notifications (each event is sent once). Service role only (RLS on, no policies).
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

create table if not exists transfer_events (
  id bigserial primary key,
  transaction_id uuid not null references transactions(id) on delete cascade,
  user_id uuid not null,
  status text not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);
create index if not exists transfer_events_tx_idx on transfer_events (transaction_id, created_at);
create index if not exists transfer_events_unnotified_idx on transfer_events (created_at) where notified_at is null;
alter table transfer_events enable row level security;
revoke all on table transfer_events from public, anon, authenticated;
grant all on table transfer_events to service_role;
grant usage, select on sequence transfer_events_id_seq to service_role;

-- One row per status change, written by the database so every path (Office, payment webhooks, the app) is covered.
create or replace function log_transfer_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into transfer_events (transaction_id, user_id, status) values (new.id, new.user_id, coalesce(new.status, 'pending'));
  end if;
  return new;
end $$;
drop trigger if exists transfer_events_log on transactions;
create trigger transfer_events_log after insert or update of status on transactions for each row execute function log_transfer_status();

-- Existing transfers get one event for their current status, already handled, so turning this on sends nothing old.
insert into transfer_events (transaction_id, user_id, status, created_at, notified_at)
select t.id, t.user_id, coalesce(t.status, 'pending'), coalesce(t.updated_at, t.created_at, now()), now()
from transactions t
where not exists (select 1 from transfer_events e where e.transaction_id = t.id);

-- A switch for transfer notifications next to orders, messages and support.
alter table push_preferences add column if not exists transfers boolean not null default true;

commit;

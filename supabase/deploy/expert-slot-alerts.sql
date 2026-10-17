-- Notify me for experts with no open times. Paste into the Supabase SQL Editor. Safe to re-run; needs the expert files before it in RUN-ORDER.md.
-- Same content as supabase/migrations/20261019160000_expert_slot_alerts.sql.
-- "Notify me" for experts with no open times: one row per customer and expert; the row is removed after the customer is told.
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

create table if not exists expert_slot_alerts (
  user_id uuid not null references users(id) on delete cascade,
  expert_profile_id uuid not null references expert_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, expert_profile_id)
);
create index if not exists expert_slot_alerts_profile_idx on expert_slot_alerts (expert_profile_id);
alter table expert_slot_alerts enable row level security;
revoke all on table expert_slot_alerts from public, anon, authenticated;
grant all on table expert_slot_alerts to service_role;

commit;

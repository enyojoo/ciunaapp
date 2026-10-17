-- Order notifications and notification settings. Paste into the Supabase SQL Editor. Safe to re-run; needs the files before it in RUN-ORDER.md.
-- Same content as supabase/migrations/20261019110000_push_preferences.sql.
-- Order notifications and notification settings. Each order event is sent to the customer once (notified_at), and each
-- customer can switch order, message and support notifications off. Service role only (RLS on, no policies).
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

alter table marketplace_events add column if not exists notified_at timestamptz;
-- Events that already exist must not be sent now.
update marketplace_events set notified_at = now() where notified_at is null;
create index if not exists marketplace_events_unnotified_idx on marketplace_events (created_at) where notified_at is null;

create table if not exists push_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  orders boolean not null default true,
  messages boolean not null default true,
  support boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table push_preferences enable row level security;
revoke all on table push_preferences from public, anon, authenticated;
grant all on table push_preferences to service_role;

commit;

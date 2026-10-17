-- Push tokens (device registrations for notifications). Paste into the Supabase SQL Editor. Safe to re-run; needs seller-portal-all.sql applied first.
-- Same content as supabase/migrations/20261018120000_push_tokens.sql.
-- Device push tokens (Expo push service). One row per device token; registering a token again moves it to the signed-in
-- user. Service role only (RLS on, no policies). The API sends; dead tokens are deleted when the service reports them.
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique check (char_length(token) between 10 and 200),
  platform text not null check (platform in ('ios', 'android', 'web')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on push_tokens (user_id) where enabled;

alter table push_tokens enable row level security;
revoke all on table push_tokens from public, anon, authenticated;
grant all on table push_tokens to service_role;

commit;

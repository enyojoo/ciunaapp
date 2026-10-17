-- Pause a store. Paste into the Supabase SQL Editor. Safe to re-run; needs storefront-details.sql applied first.
-- Same content as supabase/migrations/20261019120000_store_pause.sql.
-- Pause a store. A paused store behaves like a closed one (checkout is blocked) until the seller switches it back on.
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

alter table hub_vendors add column if not exists is_paused boolean not null default false;

commit;

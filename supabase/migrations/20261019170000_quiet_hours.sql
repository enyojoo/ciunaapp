-- Quiet hours: pushes are held while the customer's local time is inside their window (it may wrap midnight).
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

alter table push_preferences
  add column if not exists quiet_start smallint check (quiet_start between 0 and 23),
  add column if not exists quiet_end smallint check (quiet_end between 0 and 23),
  add column if not exists quiet_tz text check (quiet_tz is null or char_length(quiet_tz) <= 64);

commit;

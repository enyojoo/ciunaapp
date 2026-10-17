-- Booking reminders (one push about an hour before a session). Paste into the Supabase SQL Editor. Safe to re-run; needs the marketplace files before it in RUN-ORDER.md.
-- Same content as supabase/migrations/20261019140000_booking_reminders.sql.
-- Booking reminders: each confirmed booking is reminded once, about an hour before it starts.
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

alter table expert_bookings add column if not exists reminder_sent_at timestamptz;
-- Bookings that start within the next 75 minutes (or already passed) must not be reminded the moment this runs.
update expert_bookings set reminder_sent_at = now() where reminder_sent_at is null and slot_start < now() + interval '75 minutes';
create index if not exists expert_bookings_reminder_idx on expert_bookings (slot_start) where status = 'confirmed' and reminder_sent_at is null;

commit;

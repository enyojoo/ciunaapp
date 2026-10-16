-- Seller screens: Office-editable thresholds for Home's "Needs you" list. Additive and safe to re-run.
-- The API falls back to the same defaults when a row is missing, so deploy order does not matter.
begin;
set local lock_timeout = '5s';
insert into marketplace_settings (key, value) values
  ('low_stock_threshold', '3'),                 -- a live product at or below this many units shows under "Needs you"
  ('document_expiry_warning_days', '30')        -- a verification document expiring within this many days shows under "Needs you"
on conflict (key) do nothing;
commit;

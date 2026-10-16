-- Seller screens (Home "Needs you" thresholds). Paste into the Supabase SQL Editor. Safe to re-run; needs seller-portal-all.sql applied first
-- (it creates marketplace_settings). Same content as supabase/migrations/20261017130000_seller_screens.sql.
begin;
set local lock_timeout = '5s';
insert into marketplace_settings (key, value) values
  ('low_stock_threshold', '5'),
  ('document_expiry_warning_days', '30')
on conflict (key) do nothing;
commit;

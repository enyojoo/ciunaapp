-- Read-only check of the Ciuna deploy files. Paste into the Supabase SQL Editor and run.
-- Every row is one thing a deploy file should have created; rows with ok = false (shown first) mean that file was not fully run.
-- It changes nothing.
with checks as (
  -- 1. seller-portal-all.sql
  select 'seller-portal-all.sql' as file, 'table ' || t as what, to_regclass('public.' || t) is not null as ok
    from unnest(array['merchants','merchant_members','merchant_invites','merchant_applications','kyb_profiles','merchant_documents','merchant_payout_methods','audit_log',
                      'fee_plans','fee_rules','marketplace_settings','ledger_accounts','ledger_txns','ledger_entries','order_fees','payouts',
                      'merchant_notification_prefs','telegram_links','seller_outbox','reviews','order_messages','favorites']) as t
  union all
  select 'seller-portal-all.sql', 'function ' || f, exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = f)
    from unnest(array['ledger_post','seller_notify','seller_outbox_claim','review_submit','review_reply','review_moderate','message_send','messages_mark_read','marketplace_analytics']) as f
  union all
  -- 2. rate-limits.sql
  select 'rate-limits.sql', 'table rate_limit_hits', to_regclass('public.rate_limit_hits') is not null
  union all
  select 'rate-limits.sql', 'function rate_limit_hit', exists (select 1 from pg_proc where proname = 'rate_limit_hit')
  union all
  -- 3. office-queues.sql
  select 'office-queues.sql', 'tables reason_templates, office_saved_views', to_regclass('public.reason_templates') is not null and to_regclass('public.office_saved_views') is not null
  union all
  select 'office-queues.sql', 'function office_claim', exists (select 1 from pg_proc where proname = 'office_claim')
  union all
  -- 5. storefront-details.sql
  select 'storefront-details.sql', 'column ' || c, exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = split_part(c, '.', 1) and column_name = split_part(c, '.', 2))
    from unnest(array[
      'merchants.time_zone',
      'hub_vendors.opening_hours','hub_vendors.time_zone','hub_vendors.min_order_amount','hub_vendors.min_order_currency','hub_vendors.cover_url','hub_vendors.verification_tier',
      'marketplace_zones.eta_minutes',
      'expert_profiles.languages','expert_profiles.time_zone','expert_profiles.credentials','expert_profiles.years_experience','expert_profiles.is_verified','expert_profiles.verification_tier'
    ]) as c
  union all
  -- 6. support-requests.sql
  select 'support-requests.sql', 'table ' || t, to_regclass('public.' || t) is not null
    from unnest(array['support_requests','support_messages']) as t
  union all
  select 'support-requests.sql', 'function ' || f, exists (select 1 from pg_proc where proname = f)
    from unnest(array['support_create','support_send','support_resolve','support_mark_read']) as f
  union all
  -- 7. send-limits.sql
  select 'send-limits.sql', 'table send_limits', to_regclass('public.send_limits') is not null
  union all
  select 'send-limits.sql', 'function send_usage', exists (select 1 from pg_proc where proname = 'send_usage')
  union all
  -- 8. push-tokens.sql
  select 'push-tokens.sql', 'table push_tokens', to_regclass('public.push_tokens') is not null
  union all
  -- 9. account-deletion.sql
  select 'account-deletion.sql', 'table account_deletions', to_regclass('public.account_deletions') is not null
  union all
  select 'account-deletion.sql', 'column users.deleted_at', exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'deleted_at')
  union all
  select 'account-deletion.sql', 'function account_request_deletion', exists (select 1 from pg_proc where proname = 'account_request_deletion')
  union all
  select 'account-deletion.sql', 'function account_purge_due', exists (select 1 from pg_proc where proname = 'account_purge_due')
  union all
  -- 10. push-preferences.sql
  select 'push-preferences.sql', 'table push_preferences', to_regclass('public.push_preferences') is not null
  union all
  select 'quiet-hours.sql', 'column push_preferences.quiet_start', exists (select 1 from information_schema.columns where table_name = 'push_preferences' and column_name = 'quiet_start')
  union all
  select 'expert-main-category.sql', 'column expert_profiles.main_category', exists (select 1 from information_schema.columns where table_name = 'expert_profiles' and column_name = 'main_category')
  union all
  select 'product-main-category.sql', 'column hub_products.main_category', exists (select 1 from information_schema.columns where table_name = 'hub_products' and column_name = 'main_category')
  union all
  select 'expert-slot-alerts.sql', 'table expert_slot_alerts', to_regclass('public.expert_slot_alerts') is not null
  union all
  select 'payment-expiry.sql', 'column transactions.payment_expires_at', exists (select 1 from information_schema.columns where table_name = 'transactions' and column_name = 'payment_expires_at')
  union all
  select 'payment-expiry.sql', 'function cancel_transfer', exists (select 1 from pg_proc where proname = 'cancel_transfer')
  union all
  select 'payment-expiry.sql', 'function expire_stale_transfers', exists (select 1 from pg_proc where proname = 'expire_stale_transfers')
  union all
  select 'booking-reminders.sql', 'column expert_bookings.reminder_sent_at', exists (select 1 from information_schema.columns where table_name = 'expert_bookings' and column_name = 'reminder_sent_at')
  union all
  select 'transfer-events.sql', 'table transfer_events', to_regclass('public.transfer_events') is not null
  union all
  select 'transfer-events.sql', 'trigger transfer_events_log', exists (select 1 from pg_trigger where tgname = 'transfer_events_log')
  union all
  select 'transfer-events.sql', 'column push_preferences.transfers', exists (select 1 from information_schema.columns where table_name = 'push_preferences' and column_name = 'transfers')
  union all
  select 'store-pause.sql', 'column hub_vendors.is_paused', exists (select 1 from information_schema.columns where table_name = 'hub_vendors' and column_name = 'is_paused')
  union all
  select 'push-preferences.sql', 'column marketplace_events.notified_at', exists (select 1 from information_schema.columns where table_name = 'marketplace_events' and column_name = 'notified_at')
  union all
  select 'store-communities.sql', 'column ' || c, exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = split_part(c, '.', 1) and column_name = split_part(c, '.', 2))
    from unnest(array['merchants.communities', 'hub_vendors.communities']) as c
  union all
  select 'expert-credentials-review.sql', 'column ' || c, exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = split_part(c, '.', 1) and column_name = split_part(c, '.', 2))
    from unnest(array['expert_profiles.credentials_review', 'expert_profiles.credentials_review_reason', 'expert_profiles.credentials_reviewed_by', 'expert_profiles.credentials_reviewed_at']) as c
)
select file, what, ok from checks order by ok, file, what;

-- Second check: seeded data. Run it only after the first query shows no false rows (it reads those tables).
-- Expect templates >= 8 and both settings true.
select (select count(*) from reason_templates) >= 8 as office_queues_has_8_reason_templates,
       exists (select 1 from marketplace_settings where key = 'low_stock_threshold') as seller_screens_low_stock_setting,
       exists (select 1 from marketplace_settings where key = 'document_expiry_warning_days') as seller_screens_expiry_setting;

-- Optional files are not checked here: marketplace-cron.sql (check `select * from cron.job;`) and demo-data.sql
-- (`select count(*) from hub_products where owner_team = 'demo';` returns 18 when it was run).

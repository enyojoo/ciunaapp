-- Apply separately after API deployment to the verified staging/production database.
--
-- 1) Ensure production API has MARKETPLACE_WORKER_SECRET + MARKETPLACE_TOKEN_KEY and
--    serves POST /api/cron/marketplace (currently required before Cron is useful).
-- 2) Create Vault secrets (easiest: ./scripts/marketplace-print-vault-cron.sh | pbcopy
--    then paste into SQL Editor — that script also schedules Cron).
--    Or create manually:
--      marketplace_worker_url = https://api.ciuna.com/api/cron/marketplace
--      marketplace_worker_secret = API's MARKETPLACE_WORKER_SECRET
-- 3) Run this file if secrets already exist and only scheduling is needed.
--
-- No secret values are stored in migration history or cron.job.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if not exists(select 1 from vault.decrypted_secrets where name='marketplace_worker_url')
 or not exists(select 1 from vault.decrypted_secrets where name='marketplace_worker_secret') then
 raise exception 'Create marketplace worker Vault secrets before scheduling. Run ./scripts/marketplace-print-vault-cron.sh and paste into the SQL Editor.';
 end if;
end $$;
select cron.schedule('ciuna-marketplace-worker','* * * * *',$job$
 select net.http_post(
   url := (select decrypted_secret from vault.decrypted_secrets where name='marketplace_worker_url' limit 1),
   headers := jsonb_build_object('Content-Type','application/json','Authorization',
     'Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='marketplace_worker_secret' limit 1)),
   body := '{}'::jsonb,
   timeout_milliseconds := 60000
 );
$job$);

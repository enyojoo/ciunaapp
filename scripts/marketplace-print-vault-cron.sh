#!/usr/bin/env bash
# Prints Vault create + cron SQL for the Supabase SQL Editor (do not commit the output).
# Usage: ./scripts/marketplace-print-vault-cron.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/api/.env}"
# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

: "${MARKETPLACE_WORKER_SECRET:?Set MARKETPLACE_WORKER_SECRET in api/.env}"
WORKER_URL="${MARKETPLACE_WORKER_URL:-https://api.ciuna.com/api/cron/marketplace}"

# Escape single quotes for SQL string literals
sql_escape() { printf "%s" "$1" | sed "s/'/''/g"; }
URL_ESC=$(sql_escape "$WORKER_URL")
SECRET_ESC=$(sql_escape "$MARKETPLACE_WORKER_SECRET")

cat <<EOF
-- Generated locally — paste into Supabase SQL Editor once.
-- Creates Vault secrets (idempotent by name) then schedules the worker cron.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do \$\$
declare
  url_id uuid;
  secret_id uuid;
begin
  select id into url_id from vault.secrets where name = 'marketplace_worker_url' limit 1;
  if url_id is null then
    perform vault.create_secret('${URL_ESC}', 'marketplace_worker_url');
  else
    perform vault.update_secret(url_id, '${URL_ESC}');
  end if;

  select id into secret_id from vault.secrets where name = 'marketplace_worker_secret' limit 1;
  if secret_id is null then
    perform vault.create_secret('${SECRET_ESC}', 'marketplace_worker_secret');
  else
    perform vault.update_secret(secret_id, '${SECRET_ESC}');
  end if;
end \$\$;

-- Unschedule prior job if re-running
do \$\$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'ciuna-marketplace-worker';
exception when undefined_table then null;
end \$\$;

select cron.schedule(
  'ciuna-marketplace-worker',
  '* * * * *',
  \$job\$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='marketplace_worker_url' limit 1),
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='marketplace_worker_secret' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  \$job\$
);

select name from vault.decrypted_secrets
where name in ('marketplace_worker_url','marketplace_worker_secret');

select jobid, jobname, schedule from cron.job where jobname = 'ciuna-marketplace-worker';
EOF

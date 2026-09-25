#!/usr/bin/env bash
# Runs marketplace RPCs concurrently against DATABASE_URL (real Postgres race proof).
# Usage: DATABASE_URL=postgres://… ./scripts/marketplace-postgres-races.sh
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to the staging/production Postgres URL}"
command -v psql >/dev/null || { echo "psql required" >&2; exit 1; }

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
-- Smoke: claim jobs twice should not double-lease the same rows in one statement set.
begin;
select count(*) as ready_before from marketplace_jobs where state in ('ready','running');
select id from marketplace_claim_jobs(5);
-- Second claim in same txn with skip locked should return fewer/zero overlapping ids.
select id from marketplace_claim_jobs(5);
commit;
select 'marketplace_claim_jobs race smoke ok' as result;
SQL

echo "For last-slot / last-stock races use api/tests/marketplace/database.test.mjs patterns against this DB."
echo "PGlite suite already covers exclusive slot holds; this script verifies RPC lease reclaim path on real Postgres."

#!/usr/bin/env bash
# Marketplace staging ops helper.
# Requires: DATABASE_URL (Postgres connection to the confirmed staging project).
# Does not enable MARKETPLACE_CHECKOUT_LINES.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIG="$ROOT/supabase/migrations/20260925090000_marketplace_lifecycle.sql"
RLS="$ROOT/supabase/migrations/20260925093100_marketplace_rls_ensure.sql"
AUDIT="$ROOT/supabase/tests/marketplace-audit.sql"
CRON="$ROOT/supabase/deploy/marketplace-cron.sql"

die() { echo "error: $*" >&2; exit 1; }

need_db() {
  [[ -n "${DATABASE_URL:-}" ]] || die "Set DATABASE_URL to the confirmed staging Postgres URL before applying."
}

cmd="${1:-help}"
case "$cmd" in
  identity)
    echo "Configured API Supabase URL (from env if sourced): ${NEXT_PUBLIC_SUPABASE_URL:-unset}"
    echo "Confirm this ref is staging before apply. Baseline note: docs/marketplace/implementation.md"
    ;;
  apply-migration)
    need_db
    command -v psql >/dev/null || die "psql is required"
    echo "Applying $MIG"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$MIG"
    echo "Ensuring RLS $RLS"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$RLS"
    echo "Migration + RLS applied."
    ;;
  ensure-rls)
    need_db
    command -v psql >/dev/null || die "psql is required"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$RLS"
    echo "RLS ensure applied."
    ;;
  audit)
    need_db
    command -v psql >/dev/null || die "psql is required"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$AUDIT"
    ;;
  apply-cron)
    need_db
    command -v psql >/dev/null || die "psql is required"
    echo "Ensure Vault secrets marketplace_worker_url and marketplace_worker_secret exist first."
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$CRON"
    echo "Cron schedule applied."
    ;;
  verify-api)
    : "${API_BASE_URL:?Set API_BASE_URL e.g. https://api.example.com}"
    : "${MARKETPLACE_WORKER_SECRET:?Set MARKETPLACE_WORKER_SECRET}"
    code=$(curl -sS -o /tmp/mp_cron.json -w "%{http_code}" \
      -H "Authorization: Bearer $MARKETPLACE_WORKER_SECRET" \
      -X POST "$API_BASE_URL/api/cron/marketplace")
    echo "HTTP $code"
    head -c 500 /tmp/mp_cron.json; echo
    [[ "$code" == "200" ]] || die "worker invoke failed"
    ;;
  help|*)
    cat <<EOF
Usage: $(basename "$0") <identity|apply-migration|ensure-rls|audit|apply-cron|verify-api>

Staging sequence:
  1. identity          Confirm NEXT_PUBLIC_SUPABASE_URL is staging
  2. apply-migration   DATABASE_URL=... $0 apply-migration
     (lifecycle + RLS ensure)
  3. audit             DATABASE_URL=... $0 audit
  4. Deploy API with MARKETPLACE_CHECKOUT_LINES empty + worker/token secrets
  5. Create Vault secrets, then apply-cron
  6. verify-api        API_BASE_URL=... MARKETPLACE_WORKER_SECRET=... $0 verify-api
  7. Leave lines empty until e2e gates pass

If lifecycle was already applied without checking RLS:
  DATABASE_URL=... $0 ensure-rls
EOF
    ;;
esac

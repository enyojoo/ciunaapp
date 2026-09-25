# Marketplace release gate log

Updated: 2026-09-25

## Automated / ops evidence

| Item | Status | Evidence |
| --- | --- | --- |
| Lifecycle + RLS on remote | Done | `marketplace_orders` REST 200 |
| Worker invoke + health row | Done | Local `POST /api/cron/marketplace` → `{"processed":0,"failed":0}`; `marketplace_worker_health.last_completed_at` set |
| Shared package API import fix | Done | Hook moved to `@ciuna/shared/marketplace/use-checkout` so API middleware no longer pulls React |
| Catalog audit (live products) | Done | 9 live products; **0** missing `fulfillment_mode` / bad line |
| Expert meeting instructions | Done | Backfilled for 3 published services (IT / Educational / Barbering) |
| Delivery zones | Note | `marketplace_zones` count = 0 (pickup/digital OK; delivery needs Office zones before enabling delivery SKUs) |
| `npm run test:marketplace` | Done | Pass (DB + payments + pricing) |
| Vault secrets + cron.schedule | Pending human | Dashboard login required. Generate paste SQL: `./scripts/marketplace-print-vault-cron.sh` then run in SQL Editor; or create Vault secrets then `supabase/deploy/marketplace-cron.sql` |
| Production `api.ciuna.com` cron route | Pending deploy | Currently **404** — deploy API with `MARKETPLACE_WORKER_SECRET` + `MARKETPLACE_TOKEN_KEY` before Cron can succeed |
| Local staff enablement | Done | `api/.env` `MARKETPLACE_CHECKOUT_LINES=food` (local only; production env must stay empty until deploy + gates) |
| Production line enablement | Not started | Keep production `MARKETPLACE_CHECKOUT_LINES` empty until Vault/Cron live + staff sandbox |

## External gates (still open)

| Gate | Status |
| --- | --- |
| YooKassa sandbox widget / native SDK / 3DS | Open |
| Physical iOS/Android EAS build | Open |
| Real Postgres multi-connection races (`DATABASE_URL` + `./scripts/marketplace-postgres-races.sh`) | Open (script ready; needs DB URL) |
| Staff E2E cart/direct/user_input × manual+RUB + Office accept/refund | Open (creation available on **local API** with `food`) |
| Production `MARKETPLACE_CHECKOUT_LINES=food` | Blocked on deploy + sandbox |

## Rollback

Empty `MARKETPLACE_CHECKOUT_LINES` only. Leave webhooks, worker, order access, cancel, proof, refunds running.

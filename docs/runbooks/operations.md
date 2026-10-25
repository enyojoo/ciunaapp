# Operations runbook

For whoever is on call. Keep it short and follow it in order. Background and reasons are in `docs/build-plan/launch-readiness.md` (sections 4, 5, 10).

## What is watching what

| Signal | Where it comes from | Alert after |
| --- | --- | --- |
| A scheduled job stopped | `pingHeartbeat()` in each `api/app/api/cron/*` route, to the monitor named by `HEARTBEAT_URL_*` | two missed pings |
| An error in any app | `reportError()` (`api/lib/error-report.ts`): API route failures, and crashes from the apps through `POST /api/client-errors`; forwarded to Sentry when `SENTRY_DSN` is set | first occurrence of a new error, then a spike |
| One request across systems | `x-request-id` response header on every API call (set in `api/proxy.ts`), printed in `ERROR_REPORT` log lines and tagged on Sentry events | n/a, used to trace |
| Site up | uptime monitor on `/health` and `/api/platform/public-flags` | two failed checks |

Personal data is removed before anything leaves the API (emails, bearer and JWT tokens, card-like and phone numbers, `password`/`secret`/`token` values). The test is `api/tests/merchant/error-report.test.ts`.

Database checks to run on a schedule (hourly, from the monitor or the SQL editor); page a human when any returns a row:

```sql
-- ledger entries that do not sum to zero per transaction and currency
select txn_id, currency, sum(amount) from ledger_entries group by 1, 2 having sum(amount) <> 0;
-- marketplace worker not completing
select * from marketplace_worker_health where last_completed_at < now() - interval '5 minutes';
-- failed or stuck background jobs
select state, count(*), min(available_at) from marketplace_jobs where state = 'failed' or (state in ('ready','running') and available_at < now() - interval '10 minutes') group by 1;
-- seller alerts waiting more than 5 minutes
select count(*) from seller_outbox where status = 'pending' and created_at < now() - interval '5 minutes';
-- payouts approved for more than 48 hours
select id, merchant_id, amount, currency from payouts where status = 'approved' and decided_at < now() - interval '48 hours';
```

(Table and column names are from `supabase/migrations/20261016110000_ledger_fees_payouts.sql`, `20260925090000_marketplace_lifecycle.sql` and `20261016120000_seller_notifications.sql`.)

## When something is wrong

1. **Stop the harm first.** Money: switch checkout off by emptying `MARKETPLACE_CHECKOUT_LINES` (or disable the service line in Office). Webhooks, the worker, order access, cancel, proof upload and refunds keep running. A payment rail misbehaving (YooKassa or Bitbanker): disable it in Office, Payment methods; manual bank transfer continues.
2. **Tell people.** Use the message templates in Office, Support. Pause stores in Seller if orders cannot be fulfilled.
3. **Find it.** Take the `x-request-id` from the customer's screenshot or the Sentry event, search the Vercel logs for it. `ERROR_REPORT` lines carry the route and request id.
4. **Roll back code** with Vercel's instant rollback to the previous deployment (api, seller, office). Migrations are additive and old code ignores new columns, so code rollback needs no database rollback. **Never** roll back by dropping a table or column.
5. **Mobile builds cannot be pulled.** Rely on server compatibility (never remove or rename a response field: `api/tests/contract/flags.test.ts` guards the flags) and feature flags.
6. Write what happened, what you did and what you will change, in the incident log below, the same day.

## Correcting the ledger

The ledger is append-only: `ledger_txns` and `ledger_entries` reject update and delete. A wrong entry is fixed by posting a reversing entry, never by editing.

1. Find the transaction: `select * from ledger_txns where id = '<id>';` and its entries: `select * from ledger_entries where txn_id = '<id>';`.
2. Post a new transaction through `ledger_post(p_key, p_kind, p_lines, p_order, p_payout, p_memo)`: a new idempotency key such as `fix:<original id>`, kind `reversal`, and `p_lines` copying every original line (`merchant_id`, `kind`, `currency`) with the amount's sign flipped; the memo names the original id and the reason. The function refuses lines that do not sum to zero per currency (`LEDGER_UNBALANCED`).
3. Post the correct transaction after it.
4. Record both ids and the reason in `audit_log` (`action = 'ledger.reversed'`) and in the incident log.
5. Rehearse this once on staging before the pilot (plan item B10).

## Backup and restore rehearsal (B10)

Do once on a scratch Supabase project, then write the date and the time it took here.

1. Take a backup of staging (Dashboard, Database, Backups).
2. Create a scratch project and restore the backup into it.
3. Point a local API at it and open Office: transfers, merchants, audit log must show the same counts as staging (`select count(*)` on `transactions`, `merchants`, `audit_log`).
4. Delete the scratch project.

Last rehearsal: not yet done.

## Rollback rehearsal (R9)

On staging, deploy a deliberately broken build of the API, confirm the alert fires, roll back in Vercel, confirm recovery, and record the minutes it took. Last rehearsal: not yet done.

## Load test (G7)

```bash
LOAD_BASE_URL=https://api-staging.example.com CONCURRENCY=20 DURATION=60 node scripts/load-test.mjs
```

Read only. Budget: p95 under 800 ms, errors under 1 percent; 429 answers are counted separately (they show the rate limits work). It refuses URLs that do not look like staging.

## Incident log

| Date | What happened | Cause | Fix and follow-up |
| --- | --- | --- | --- |
| | | | |

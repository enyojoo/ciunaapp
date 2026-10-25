# Owner steps

Things only the project owner can do: they need your accounts, your database login or a legal decision. Each step says what to do, how long it takes, and how to know it worked. They follow the order in `docs/build-plan/testing-readiness-plan.md`. Do them top to bottom; the first four unblock everything else.

Every command below runs in the Supabase SQL editor unless it says otherwise.

## 1. Back up production (B0, 5 minutes)

1. Supabase Dashboard, project `seeqjiebmrnolcyydewj`, Database, Backups. Click **Create backup** (or confirm today's scheduled backup finished).
2. Write the time next to the project ref in `docs/marketplace/release-gate-log.md`.
3. Optional but good: a schema-only dump from your machine, `pg_dump --schema-only --no-owner "$DATABASE_URL" > schema-before.sql`, kept outside the repo.

Done when a backup exists and its time is written down.

## 2. Run the two pending SQL files, then check (B1, B2, 10 minutes)

Production is missing files 17 and 18 from `supabase/deploy/RUN-ORDER.md`. The app works without them, but experts and products are not grouped by category until they run.

1. Open `supabase/deploy/expert-main-category.sql`, paste it into the SQL editor, run it.
2. Open `supabase/deploy/product-main-category.sql`, paste, run.
3. Open `supabase/deploy/verify-all.sql`, paste, run. **No row may show `ok = false`.** If one does, it names the file that did not finish: run that file again.
4. Run the second query at the bottom of `verify-all.sql`. All three columns must be `true`.

Send me any error text; each file is one transaction, so nothing is half applied.

## 3. Check the background worker (B3, 5 minutes)

```sql
select * from cron.job;
select * from cron.job_run_details order by start_time desc limit 20;
```

If `cron.job` is empty, run `./scripts/marketplace-print-vault-cron.sh` on your machine (it needs `MARKETPLACE_WORKER_SECRET` and `MARKETPLACE_TOKEN_KEY` set on the API) and paste its output into the SQL editor. Done when the job exists and its last runs say `succeeded`.

## 4. Create the staging project (B4, H1, 30 minutes)

Everything you test should run against a copy, not the live database. Today `api/.env` points at production.

1. Supabase, New project, name it `ciuna-staging`, same region as production.
2. Apply the chain: run the files in `supabase/migrations` in order, then the `supabase/deploy` files from `RUN-ORDER.md`. The baseline tables (`users`, `transactions`, `hub_products`, `hub_vendors` and others) are not in the migrations yet (plan item B6). Until that is closed, create staging by restoring the production backup from step 1 into the new project, then clear customer data (users, transactions, orders, documents) from it.
3. Write both refs in `docs/marketplace/release-gate-log.md`.
4. Make a second env file for development, `api/.env.staging`, with the staging URL and keys, and point `api/.env`, `seller/.env`, `office/.env` and `mobile/.env` at it. Keep the production service-role key off laptops: put it only in the Vercel production project.
5. Seed demo data on staging (not production): `supabase/deploy/demo-data.sql`.

Done when `npm run dev -w api` talks to staging and a test order never appears in production.

## 5. Set send limits on production (B11, 10 minutes, compliance confirms)

Until rows exist, sending money is not capped. `select count(*) from send_limits;` is 0 today.

1. Office, Send limits.
2. Enter the schedule in section 14 of the readiness plan (per verification level: per transfer, per day, per month).
3. Have whoever owns compliance confirm the amounts before you save.

Done when `select count(*) from send_limits;` is above 0 and the Send screen shows a range.

## 6. Remove demo data from production (B12, 5 minutes)

18 demo products and the demo stores are live. Remove them before real customers browse.

1. Paste `supabase/deploy/demo-data-remove.sql`, run it. It refuses to run if a real order or booking points at a demo row.
2. `select count(*) from hub_products where owner_team = 'demo';` must return 0.
3. Load the same data on staging instead (step 4.5).

## 7. API environment values (C1, 15 minutes)

In the Vercel `api` project (production) and in `api/.env` (local), set the names listed under "Added for launch readiness" in `env.example`:

- `CORS_ALLOWED_ORIGINS`: exact origins, comma separated, no wildcard. For example `https://seller.ciuna.com,https://office.ciuna.com,https://app.ciuna.com`.
- `INTERNAL_API_SECRET`: 32 random characters.
- `MERCHANT_PAYOUT_KEY`: 32 random bytes, base64 (`openssl rand -base64 32`). **Store a copy in your password manager.** Without it payout details cannot be read back. In production the code no longer falls back to `MARKETPLACE_TOKEN_KEY`.
- `SENTRY_DSN` (step 8), `HEARTBEAT_URL_*` (step 9).
- `BITBANKER_TEST_CLIENT_ID` on staging only.

## 8. Error tracking (G1, 15 minutes)

The code is done: apps send crashes to the API, the API scrubs emails, tokens, card and phone numbers and forwards to Sentry when `SENTRY_DSN` is set.

1. Create a Sentry project (type Node), copy its DSN.
2. Set `SENTRY_DSN` on the Vercel `api` project, redeploy.
3. Force one: `curl -X POST https://api.ciuna.com/api/client-errors -H 'content-type: application/json' -d '{"source":"mobile","message":"test error"}'`. It appears in Sentry within a minute.

## 9. Heartbeats and alerts (G2, 30 minutes)

Create a free monitor (Better Stack or Healthchecks.io) with one heartbeat per job and set the matching `HEARTBEAT_URL_*` on the API. Expected intervals (from `api/vercel.json` and the Supabase cron): `marketplace` every minute, `seller_notifications` every minute, `order_notifications` every minute, `merchant_money` every 15 minutes, `sync_exchange_rates` daily at 06:00, `account_purge` daily at 03:00. Alert after two missed pings to the on-call channel named in section 14 of the plan. Add an uptime check on `/health` and `/api/platform/public-flags`.

## 10. Vercel (C9, 15 minutes)

- Plan: the API needs **Pro** (cron every minute and every 15 minutes is not allowed on Hobby).
- Each project needs a root directory, domain and environment documented in `docs/marketplace/release-gate-log.md`: `api` (root `api`, `api.ciuna.com`), `seller` (root `seller`), `office` (root `office`).
- Preview deployments must use the staging Supabase keys, never production.
- Delete the root `vercel.json` (it still describes the removed `web/` site) or leave it unused; every project sets its own root.

## 11. Checks only you can do in the Supabase dashboard (G4)

- Storage: buckets `kyc-documents`, `transaction-receipts` and `merchant-documents` must show **Private**. (`merchant-assets` is public on purpose: logos and listing images only.)
- Authentication: turn on MFA for staff, and set a minimum password length.
- Decide about `payment_methods`: the anonymous key can read Ciuna's receiving bank details (two active rows). If only signed-in customers should see them, tighten the policy; if they are meant to be public, add the table to `PUBLIC_TABLES` for `scripts/rls-probe.mjs`.

## 12. Accounts and devices (H, R1, R7)

Apple Developer and Google Play accounts connected to EAS (`eas login`, then `eas credentials`); a review account per language for the stores; devices from H3 (one recent iPhone, one small iPhone, one mid-range Android, one large screen). Store text is drafted in `docs/release/store-listing.md`.

## 13. YooKassa native build (F9)

YooMoney's SDK hosts are not reachable from this network. Run `eas build --profile production --platform ios` (and Android) from a network that reaches `git.yoomoney.ru`, or let EAS build it. Pilot payments use the web widget and `/pay/[transactionId]` until the native build is verified.

## 14. Legal (G5)

Counsel signs Terms, Privacy, seller agreement, payout terms, KYC limits copy, refund policy, referral terms and names the 54-FZ receipt owner. Replace placeholder numbers with the Office values from step 5.

## 15. App builds (R2, H1)

`mobile/eas.json` has four profiles: `development` (team dev client), `preview`, `staging` (installable build pointed at staging) and `production` (store builds, build numbers increase automatically). Set the staging values once with EAS environment variables, then build:

```bash
cd mobile
eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://api-staging.example.com --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://<staging-ref>.supabase.co --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value <staging anon key> --visibility plaintext
eas build --profile staging --platform all
```

Repeat with `--environment production` and the production values for store builds. The anon key is public by design; never put a service-role key in an `EXPO_PUBLIC_` variable.

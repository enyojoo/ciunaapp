# SQL to run in Supabase (live project)

Paste each file into the Supabase SQL Editor, in this order. Every file is additive, safe to re-run, and gives up after 5 seconds if it cannot lock a table (so it cannot hang your site; just run it again). **Take a backup first** (Dashboard, Database, Backups). The API and apps work without these files (new features show "unavailable" or empty states), so you can run them whenever you are ready; run them in order.

| # | File | What it adds | After running, check |
| --- | --- | --- | --- |
| 1 | `seller-portal-all.sql` | Seller platform: merchants, team, applications, KYB, ledger, fees, payouts, alerts, reviews, order chat, analytics, search and favourites. Backfills a merchant for every existing vendor and expert. Starts with four pre-check queries: run those first and send me any rows they return. | verify queries at the bottom return 0 |
| 2 | `rate-limits.sql` | Rate limiting table and function (search 60/min per IP, checkout 10/min, review 20/min). | none needed |
| 3 | `office-queues.sql` | Office queues: claim and SLA on merchant applications and listing review, rejection reason templates (8), saved views. Needs file 1. | `select count(*) = 8 from reason_templates;` |
| 4 | `seller-screens.sql` | Seller Home thresholds (low stock, document expiry warning). Needs file 1. | none needed |
| 5 | `storefront-details.sql` | Store opening hours and time zone, minimum order, delivery ETA per area, store cover, verification tier; expert languages, time zone, credentials, years of practice and verified flag. Backfills from merchants. Needs file 1. | `select count(*) from hub_vendors where opening_hours is not null;` runs without error |
| 6 | `support-requests.sql` | Customer support requests and message threads, with the functions that keep status and unread counts (open, awaiting you, resolved). Needs file 1. | `select count(*) from support_requests;` returns 0 |
| 7 | `send-limits.sql` | Send limits per verification level (table and usage function). No amounts are added: compliance sets them (see the example in the next-session plan or use the Office API); until then nothing is limited. | `select count(*) from send_limits;` returns 0 |
| 8 | `push-tokens.sql` | Device push tokens for notifications. The app side still needs the notifications package, so nothing is sent until that ships. | `select count(*) from push_tokens;` returns 0 |
| 9 | `account-deletion.sql` | Account deletion: request, restore, and the removal of personal data after 30 days. | `select count(*) from account_deletions` returns 0 |
| 10 | `marketplace-cron.sql` (only if not done) | Marketplace background worker schedule and secrets. Needs the API deployed with `MARKETPLACE_WORKER_SECRET` and `MARKETPLACE_TOKEN_KEY`. Use `./scripts/marketplace-print-vault-cron.sh` to generate it. | `select * from cron.job;` |
| check | `verify-all.sql` | Read-only. Lists every table, function and column the files above should have created. Run it any time; rows with `ok = false` come first and name the file that was not fully run. A second query at the bottom checks the seeded data. Changes nothing. | no row shows `false` |
| optional | `demo-data.sql` | Demo content: 9 Food products on lacabana and harvest-lane, 2 demo Mart stores with 9 products, Moscow delivery zones, 3 demo experts with services and weekday slots (next 14 days). Run after file 3 (needs file 1). Safe to re-run. | `select count(*) from hub_products where owner_team = 'demo';` returns 18 |
| separate | `demo-data-remove.sql` | Removes only the demo rows. Refuses to run if a real order or booking references demo data. Not part of the normal order. | the count above returns 0 |

New SQL files from future work are appended to this table in the order to run them (see the rule in `docs/build-plan/00-kickoff.md`).

If any file shows an error, stop and send me the error text; nothing is half-applied because each part is one transaction.

# Launch readiness: before real money

Companion to `api-and-data.md`. Sources: `docs/seller-portal-runbook.md`, `docs/marketplace/implementation.md`, `docs/marketplace/release-gate-log.md`, `api/vercel.json`, `env.example`, migrations. Nothing here is verified against production; items marked **confirm** need a human with access. No calendar dates: each gate is passed by evidence, recorded in a log in the style of `docs/marketplace/release-gate-log.md` (environment, scenario, result, evidence).

## 1. Staging migration order

Do not trust the staging project identity: the release gate log says the configured project "was not confirmed to be staging". First gate is proving which project is which.

1. **Confirm identity.** Compare project ref in `api/.env` with the Supabase dashboard. Write it in the gate log. Never run the lifecycle test baseline (`supabase/tests/marketplace-baseline.sql`) against a remote project.
2. **Backup**, then schema-only `pg_dump` of staging; diff against production. Keep both dumps.
3. **Apply in this order** (all additive, idempotent):
   1. `supabase/migrations/20260918213000_hub_cart_and_gateway_payments.sql`
   2. `20260919120000_user_avatar.sql`
   3. `20260923190000_bitbanker_integration.sql`, `20260923210000_bitbanker_form_snapshot.sql`, `20260924120000_exchange_rates_metadata.sql`, `20260924180000_bitbanker_kyc_sessions.sql`
   4. `20260925090000_marketplace_lifecycle.sql`, `20260925093100_marketplace_rls_ensure.sql`, `20260925143000_marketplace_notify_gate.sql`, `20260925152000_marketplace_cancel_restore_cart.sql`
   5. `20261016100000_merchants_foundation.sql` (backfills a placeholder merchant for every vendor and expert)
   6. `20261016110000_ledger_fees_payouts.sql`, `...120000_seller_notifications.sql`, `...130000_reviews.sql`, `...140000_order_messages.sql`, `...150000_marketplace_analytics.sql`, `...160000_discovery.sql`
   7. New migrations from `api-and-data.md` section 2, each after its package passes.
   Core tables (`hub_products`, `hub_vendors`, `users`, `transactions`, ...) are in `docs/marketplace/schema-baseline.json` only, not in migrations: the chain only runs on a database that already has them. WP0 of the plan fixes this; until then staging must be cloned from production, never built fresh.
4. **Run twice.** Re-apply the whole chain; it must produce no errors and no schema diff.
5. **Verify**: `select count(*) from hub_vendors where merchant_id is null` is 0; same for `hub_products` and `expert_profiles`; `supabase/tests/marketplace-audit.sql` is clean; `select extname from pg_extension where extname='pg_trgm'` returns a row (the migration silently skips it otherwise); RLS enabled on every table in the money and chat paths (`select relname from pg_class where relkind='r' and not relrowsecurity and relnamespace='public'::regnamespace` should list only intended tables).
6. **Seed**: fee plans and rules (migration seeds 8, 6, 12 percent placeholders; set real launch numbers in Office Fees before approving any merchant, per `guides/80-decisions.md`: food 8, mart 6, experts 12, withdraw fee 1 percent), hold days (default 2), minimum payout per currency, KYC level limits (Office data), referral tiers.
7. **Concurrency gate**: run `scripts/marketplace-postgres-races.sh` with `DATABASE_URL` for staging (last item, last slot, accept versus cancel, payment versus expiry, cart edit versus checkout). PGlite cannot prove these.
8. Add a payout race test: two connections calling `payout_decide` and `payout_request` on the same payout and balance.

## 2. Environment variables and secrets

Missing from `env.example` today (add placeholders, no values): `MERCHANT_PAYOUT_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `NEXT_PUBLIC_SELLER_URL`. Planned by `api-and-data.md`: `TRANSLATE_PROVIDER`, `TRANSLATE_API_KEY`, `EXPO_ACCESS_TOKEN`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, LLM key for the assistant.

| Variable | Where | Rule |
| --- | --- | --- |
| `MERCHANT_PAYOUT_KEY` | api | 32 random bytes base64 (`openssl rand -base64 32`). Separate from `MARKETPLACE_TOKEN_KEY` (used only as fallback; remove the fallback before launch). **Loss makes stored payout details unreadable.** Back up in a password manager vault with two holders. Rotation needs a re-encrypt script; write and test it before launch (key id stored beside ciphertext). |
| `MARKETPLACE_TOKEN_KEY` | api | base64 32 bytes; changing it while native replay records exist makes them unrecoverable. |
| `MARKETPLACE_WORKER_SECRET` | api + Supabase Vault | Bearer secret; mirrored as Vault secret `marketplace_worker_secret`. |
| `MARKETPLACE_CHECKOUT_LINES` | api | **Empty in production until gates pass**, then `food`, `food,mart`, `food,mart,experts` (rollout in `docs/marketplace/implementation.md`). |
| `CRON_SECRET` | api | Used by `cron/merchant-money`, `cron/seller-notifications`, `cron/sync-exchange-rates` and as fallback in `send-email-notification`. All reject if empty; confirm it is set and long (32+ chars). |
| `INTERNAL_API_SECRET`, `WEBHOOK_SECRET`, `JWT_SECRET` | api | Distinct random values, not reused. |
| `SUPABASE_SERVICE_ROLE_KEY` | api only | Never in `NEXT_PUBLIC_*`, Seller, Office client bundles, or Expo. Grep the built bundles for the key prefix before release. |
| `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` | api | Sandbox keys on staging, live on production. YooKassa does not sign webhooks; the code re-fetches the payment (correct); keep an IP allow-list as defence in depth (**confirm** YooKassa published ranges). |
| `BITBANKER_*` | api | `BITBANKER_ENVIRONMENT` explicit per environment; `webhooks/bitbanker/*` verify signatures. |
| `TELEGRAM_*` | api | Register webhook with `secret_token`; webhook route rejects empty secret. |
| `SES_*`, `AWS_*` | api | SES out of sandbox; SPF, DKIM, DMARC on the sending domain. |
| `CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_SELLER_URL`, `NEXT_PUBLIC_OFFICE_URL` | api | Exact origins; no wildcard; staging origins only on staging. `api/lib/cors.ts` also allows private dev hosts: confirm that branch is disabled when `NODE_ENV=production`. |
| `EXPO_PUBLIC_YOOKASSA_*` | mobile | Public by design; native build only. |
| `NEXT_PUBLIC_SELLER_MOCK` | seller | **Must be unset** outside local review. Add a build check that fails if set in production. |

Rules: one secret store per environment (Vercel project env, Supabase Vault); separate keys for staging and production; no secret in git, logs or Office UI; two named humans can rotate each secret; a rotation runbook per key (who, how, what breaks).

## 3. Vercel plan, cron and limits

- `api/vercel.json` schedules `sync-exchange-rates` daily, `merchant-money` every 15 minutes, `seller-notifications` every minute. **Vercel Hobby only allows daily crons, so production needs Pro** (the runbook says so); confirm plan, region and that cron invocations show in project logs after deploy.
- The marketplace worker is not a Vercel cron: it is Supabase `pg_cron` + `pg_net` calling `/api/cron/marketplace` every minute with a Vault secret (`supabase/deploy/marketplace-cron.sql`, `scripts/marketplace-print-vault-cron.sh`). It is a human step in the SQL editor. The log shows `api.ciuna.com/api/cron/marketplace` returned 404 until the API deploy. Gate: heartbeat row `marketplace_worker_health.last_completed_at` less than 2 minutes old for 30 minutes continuously.
- Function duration: money jobs set `maxDuration = 60`; check the plan's cap and that a 10-job batch finishes within it under staging load.
- Cron overlap: Vercel can invoke while the previous run is still going. `seller_outbox_claim` and marketplace leases handle this (two-minute leases); add a test with two simultaneous `merchant-money` calls (`earnings_release_due` must be safe to repeat).
- If any cron fails silently the seller sees no new-order alerts: add a dead-man check (section 4).
- Seller and Office are separate Vercel projects (root `seller`, `office`); domains `seller.ciuna.com`, `api.ciuna.com`, `app.ciuna.com`. Preview deployments must point at staging Supabase, never production keys.

## 4. Observability and alerting

Today: `console.error` only. Required before pilot:

1. **Error tracking** on api, seller, office, web, mobile (Sentry or equivalent), with request id, route, user id hash, no PII, no bodies of KYC or payout routes. Scrub `authorization`, payout details and document URLs.
2. **Structured logs** with `request_id`, route, status, duration, client and version headers. Log retention stated (data protection section).
3. **Alerts (page a human):**
   - marketplace worker heartbeat older than 5 minutes; `marketplace_jobs` failed count above zero; oldest pending job age
   - `seller_outbox` rows pending older than 5 minutes or failed after retries
   - `merchant-money` cron not run for 30 minutes
   - payment webhook 5xx rate; payment attempts in unknown state older than 15 minutes
   - ledger invariant: any `ledger_txns` whose entries do not sum to zero (query runs hourly); negative merchant available balance
   - payout in `approved` for more than 48 hours (Office already shows Over 48h)
   - exchange rate stale beyond its threshold; `sync-exchange-rates` failed
   - SES bounce or complaint rate; 5xx rate on any route above a threshold
   - Supabase: connection saturation, disk, replication lag (**confirm** plan metrics)
4. **Dashboards**: orders by state, acceptance rate and median time to accept, payout queue age, refund count, GMV, take rate (Office Analytics exists: `marketplace_analytics`).
5. **Uptime** checks on `/health`, `public-flags`, and a synthetic authenticated read; status page for Maintenance mode.
6. **Dead-man switches**: each cron pings an external heartbeat monitor on success.

## 5. Load and abuse limits

No rate limiting exists (`api/proxy.ts` only adds CORS). Proposed starting limits (tune with data; per user id, else per IP):

| Surface | Limit |
| --- | --- |
| `auth/login`, `auth/admin/login`, `forgot-password`, `verify-reset-otp`, `register`, `resend-verification` | 5 per 15 min per email and 20 per hour per IP; existing `login_attempts` lockout stays, but its table has no DDL (WP0) |
| `hub/orders/[id]/messages` POST (chat) | 20 per minute and 300 per day per user; 2000 characters (SQL check already) |
| `merchant/messages/[orderId]` POST | same as customer |
| `hub/search` | 30 per minute per IP, 120 per hour; query 2 to 60 characters (exists); cache popular queries 30 s |
| `hub/favorites` PUT/DELETE | 60 per minute |
| `hub/orders/[id]/review` | 5 per hour |
| `hub/checkout`, `send/quotes`, `send/transfers` | 10 per minute per user; idempotency keys honoured, never rate-limit a replay of the same key |
| `kyc/submissions`, uploads (`merchant/uploads`, `merchant/documents`) | 10 per hour; file size and type allow-list; malware scan before Office can open (plan section 10) |
| `assistant/*`, support | token and request budget per day |
| Webhooks | verify signature or re-fetch; no user limit; body size cap |

Also: request body size caps on all JSON routes; pagination caps (favourites 200, search 40); a per-merchant cap on listings and image count; Supabase connection pooling (PgBouncer, transaction mode) for serverless; load test staging with a realistic first-week profile and 10x it for order creation, chat polling (Seller polls every 30 seconds, so budget for sellers x 2 requests per minute) and search. Exit: p95 under target, no stuck leases, no duplicate orders.

## 6. Security review checklist: money paths

Run as a written review with a second engineer. Each item gets evidence (test name or query).

**Ledger**
- [ ] `ledger_txns` and `ledger_entries` reject update and delete (trigger `ledger_immutable`); also revoke `update, delete` from `service_role` where possible, or test that the API code never issues them
- [ ] `ledger_post` checks entries sum to zero per currency; test with unbalanced lines
- [ ] Posting is idempotent by `p_key` (unique); replaying a fulfil, release or reversal posts nothing new
- [ ] Balances are derived (`ledger_balance`), never a stored mutable number
- [ ] Refund after earning release: `earning_reverse` behaviour when available balance is already withdrawn (negative balance policy decided and tested)
- [ ] Fee snapshot frozen at accept (`snapshotOrderFee`); changing a rule later does not alter accepted orders
- [ ] Currency mismatch between order, earning and payout rejected

**Payouts**
- [ ] `payout_request` locks the merchant's rows and checks available balance after the lock; two simultaneous requests cannot overdraw (two-connection test)
- [ ] `payout_decide` locks the payout (`for update`); two Office users cannot pay twice (second gets `INVALID_TRANSITION`); mark-paid requires a reference; add unique index on `(reference)` per rail to prevent a reference reused
- [ ] Only verified payout methods can receive money; changing method details un-verifies it; verifier is not the requester
- [ ] Destination details encrypted (`payout-crypto.ts`), decrypted only for finance in Office, every view audited; card numbers rejected
- [ ] Minimum payout, hold days, daily and per-payout caps (add cap) read from Office settings, enforced in SQL not UI
- [ ] Payout alert emails never include full destination

**Idempotency and checkout**
- [ ] Every money-moving POST takes an idempotency key; same key with a different body returns `IDEMPOTENCY_CONFLICT` (exists in lifecycle SQL); test for refunds and payouts too
- [ ] YooKassa and Bitbanker webhooks verified (re-fetch or signature), deduplicated by provider event id, safe to replay and to arrive out of order; late payment after cancellation lands in an Office exception
- [ ] Amount, currency and method re-checked server-side against the quote (`PAYMENT_MISMATCH`); client totals never trusted
- [ ] Manual payment proof uploads are private, signed, size-limited
- [ ] Refunds: full including fees, exactly once, restock once; partial refunds need reason and cap

**Authorisation**
- [ ] Merchant membership checked on every `merchant/*` route with `x-merchant-id` verified against membership, not trusted
- [ ] Every Office route uses `requireAdminCan` (WP1); matrix test; `requireSuperAdmin` for settings and fees
- [ ] RLS on every table, no `grant` to `anon` or `authenticated`; test as `anon` and `authenticated` roles that every table denies select, insert, update, delete
- [ ] Customer can only read own orders, chats, receipts; one merchant cannot read another's orders, earnings or documents (extend `api/tests/merchant/database.test.mjs`)
- [ ] Audit log append-only (`audit_log_immutable`), written for every Office write, never contains secrets
- [ ] SSRF and open redirect review on any URL fields (image URLs: `hub-product-image-url.ts`)

## 7. Data protection for documents

KYB and KYC documents are the highest risk data held.

- **Storage**: `merchant-documents` private bucket (created on first upload); verify it is not public; same for KYC document buckets (`kyc_submissions.id_document_url`: **confirm** these are private, signed URLs only, not public links). `merchant-assets` is public by design: only logos and listing images.
- **Access**: no direct bucket URLs to clients; short-lived signed URLs (minutes); issued only after a role check (`kyb.manage`, `kyc.review`) and **logged** in `audit_log` (who, what document, when, why). Add a `document_access_log` view or reuse `audit_log` with `action = 'document.view'`. Alert on bulk access.
- **Retention** (legal to confirm): KYB and KYC files kept for the statutory period after relationship ends, then deleted by a scheduled job with a deletion log; rejected applications' files deleted after a short window; account deletion anonymises `users` but keeps what law requires. Write the schedule in a table `retention_policies` and make the job auditable.
- **Encryption**: at rest by Supabase; payout details app-layer encrypted; consider app-layer encryption for ID numbers in `kyc_submissions.metadata`.
- **Minimisation and PII in logs**: no document URLs, names, ID numbers or payout details in logs or error tracking; test with a log scrubber unit test.
- **Uploads**: type and size allow-list, re-encode images, virus scan before availability, EXIF stripped.
- **Third parties**: list processors (Supabase, Vercel, SES, Telegram, Bitbanker, YooKassa, translation provider, LLM, push providers) with data categories; data processing agreements; cross-border transfer basis for Russian personal data (**confirm** localisation obligations with counsel before pilot).
- **Data subject requests**: export and deletion procedure; chat and support transcripts included.
- **Staff access**: Office accounts need MFA (**confirm** Supabase Auth settings), least privilege roles, offboarding checklist.

## 8. Legal copy placeholders to confirm

Ship nothing that says "approved" until counsel signs. Each needs owner, text, six-language translation.

- Terms of Service and Privacy Policy (merged into one Legal row per CustomerMore), including data processors and retention
- Seller agreement: commission rates (8, 6, 12 percent are placeholders), hold days, refund and chargeback liability, prohibited items per line, tax responsibility (INN or self-employed), suspension rules
- Payout terms: minimum, fee (1 percent placeholder), timing, "SBP or bank account only", no card numbers
- KYC levels copy and limits (₽50,000, ₽600,000, ₽2,000,000 are placeholders on cards, not facts)
- Support hours and reply-time promises (draw nothing unless Office sets hours)
- Refund and cancellation policy on each listing; expert booking cancellation policy
- Referral programme terms (tiers, reward window, abuse and blocking)
- Review and chat moderation policy; notice that messages may be machine translated
- Cookie and consent copy for web and Seller
- Receipts and invoices: legal entity name, tax ids, fiscal receipt obligations (54-FZ online receipts for Russian payments: **confirm** who issues)
- Email footer: company line, address, unsubscribe where required
- Name rule: providers named only in Office; check all copy once with a search for provider names

## 9. Internal pilot checklist: first 5 merchants

Mix: 2 food stores, 1 mart, 2 experts (one Russian, one remote in another timezone). Staff-only customers first.

Before:
- [ ] Sections 1 to 6 gates passed on staging, evidence logged; production migrations applied; fee rules, KYC limits set in Office; `MARKETPLACE_CHECKOUT_LINES` still empty
- [ ] Office users created with correct roles (finance, compliance, ops); at least two humans per role for cover; `admin` legacy users mapped
- [ ] Alerts delivered to a named on-call channel; test alert fired
- [ ] Telegram bot live and a test link works; SES out of sandbox; push tested on one iOS and one Android build
- [ ] Support path staffed (a human reading the inbox and chat)

Per merchant:
- [ ] Application reviewed with KYB documents; decision reason recorded
- [ ] Owner trained: accept and reject in time, fulfil, chat, payout request
- [ ] Payout method added and verified by finance; test payout of the minimum amount paid manually and reconciled
- [ ] Catalog reviewed; fulfilment and delivery zones set (`marketplace_zones` is empty on the staging project per the gate log: pickup and digital work; delivery needs zones)
- [ ] One staff test order end to end: manual method and YooKassa sandbox, accept, fulfil, earning appears pending, release after hold, payout, ledger balanced
- [ ] One refund and one cancel rehearsed; one chat thread with translation; one review left and replied

Pilot run:
- [ ] Enable `food` only (staff customers), then add lines one at a time per rollout plan; real customers invited in small groups
- [ ] Daily review: ledger invariant query, unmatched payments, overdue orders, payout queue, errors, support inbox
- [ ] Stop conditions defined (below) and a named decision owner

## 10. Rollback plan

- **Checkout kill switch**: empty `MARKETPLACE_CHECKOUT_LINES` (or disable a service line in Office). Leave webhooks, worker, order access, cancel, proof upload and refunds running (stated rule in marketplace docs).
- **Maintenance mode** (after WP4): blocks new money requests with 503 while reads, webhooks and crons continue.
- **Payouts pause**: add `payouts_enabled` setting; when off, `payout_request` returns a clear error; existing requests stay.
- **Code**: Vercel instant rollback to the previous deployment for api, seller, office, web. Because migrations are additive and the previous code ignores new columns, code rollback needs no database rollback. Never roll back by dropping a table or column.
- **Database**: restore from backup only for data corruption, to a new project, then reconcile; ledger is append-only so corrections are reversing entries, never edits. Write the reversing-entry procedure and test it on staging.
- **Mobile**: store builds cannot be pulled quickly: server-side compatibility rules (`api-and-data.md` section 4) and feature flags are the rollback. Keep the previous two API contracts live. Use `minSupportedVersion` only as last resort.
- **Merchant comms**: template message for sellers and customers; Telegram and email broadcast ready.
- **Provider incidents**: YooKassa or Bitbanker outage: disable that rail in Office payment methods; manual rail continues.
- Rehearse one rollback on staging before pilot.

## 11. Go / no-go criteria

**Go** only if all are true, with evidence in the gate log:

1. Migration chain applied twice on a real Postgres, schema diff against production empty, baseline gap closed (WP0) or staging cloned from production.
2. All Section 6 money-path items checked; two-connection tests for last item, last slot, accept versus cancel, payout request, payout decide pass; ledger invariant query returns zero violations after the full rehearsal.
3. YooKassa sandbox (widget, native SDK and 3DS, dismissal, lost response, webhook and poll races, late payment after cancel) and Bitbanker flows pass; physical iOS and Android builds tested.
4. RLS and privilege tests green; every Office route covered by the role matrix test; no route on Office uses bare `requireAdmin` for writes.
5. Secrets: all section 2 variables set per environment, payout key backed up and recovery tested, service-role key absent from client bundles, `NEXT_PUBLIC_SELLER_MOCK` unset.
6. Cron and worker healthy for a continuous soak (heartbeat, outbox drained, earnings released) and alerts proven by deliberate failure.
7. Rate limits live on auth, chat, search, checkout; load test passed.
8. Document handling reviewed: private buckets verified, signed URL access logged, retention schedule written, processors listed.
9. Legal copy in section 8 signed off, including placeholders replaced by real numbers from Office.
10. Backups restored once on a scratch project; rollback rehearsed; on-call named; support staffed.
11. Pilot merchants trained and one real minimum payout reconciled by finance.

**No-go / stop** triggers (any one): a ledger transaction that does not balance; any duplicate payout or double refund; an order paid but not found in Office after 15 minutes; money route reachable by an unauthorised role; document served without a signed URL; worker heartbeat down more than 10 minutes with live orders; unresolved unknown payments older than 24 hours; seller or customer data visible across accounts. On stop: kill switch, pause payouts, preserve logs, run the incident review, record in the gate log before resuming.

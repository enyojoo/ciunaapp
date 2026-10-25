# Testing-readiness plan: everything left before Ciuna can be tested end to end

Written 2026-10-25 from measurements taken that day, not from earlier status pages. It covers the API, Seller, Office and the customer app (`mobile/`, native and Expo web). Companion docs: `launch-readiness.md` (the money-path security, data protection, rollback and go/no-go checklists; this plan sequences work and points into it, it does not repeat it), `customer-completion-plan.md`, `office.md`, `seller.md`, `api-and-data.md`.

**Goal of this plan:** reach a state where a small group of staff can test every app on real devices against a staging environment, with money paths verified, then widen to a pilot. Release to the stores comes after that.

## 1. Where we are (verified 2026-10-25)

| Area | Result today | Evidence |
|---|---|---|
| Type-checks | API, Seller, mobile clean. **Office: 46 errors**, hidden by `typescript.ignoreBuildErrors: true` in `office/next.config.mjs` | `tsc --noEmit` per package, exit codes checked |
| API tests | 160 + 78 merchant, 20 marketplace pass (a stale test was fixed: it did not know SQL files 17, 18, 20) | `npm run test:merchant`, `test:marketplace` in `api/` |
| Shared tests | 14 pass | `packages/shared` |
| Seller browser tests | **192 pass, 3 fail**: expert owner `/profile` at 375, 768 and 1280 (console error: CORS block on `/api/merchant/expert/credentials`) | `npm run test:seller` |
| Office / mobile automated UI tests | none exist | `tests/` holds Seller only |
| Mobile bundles | iOS and web production exports build | `expo export` |
| Native build | compiles and runs on the iOS simulator **without YooKassa** (`SKIP_YOOKASSA=1`). Android never built. Real device never used. | SDK 58 work, 2026-10-18 |
| Database | 49 of 51 probes pass. **Files 17 and 18 not applied** (`expert_profiles.main_category`, `hub_products.main_category`) | read-only probes through the REST API |
| Design system | tokens and component specs pass (`design:check`, `design:cards`). Visual audit (`design:audit`) not run. | scripts |
| Error tracking | none installed in any app | no Sentry, Bugsnag or similar in any `package.json` |
| Database in use | **This is a live database, not staging.** 160 transfers from 2025-08-13 to 2026-10-16 (136 completed, 17 different senders, NGN to RUB the largest corridor, median completed amount 26,000, maximum 834,000 in the sender's currency), 47 users, 12 marketplace orders none paid, 0 ledger entries. Payment keys in `api/.env` are sandbox. **Send limits: 0 rows, so sending is uncapped.** | read-only aggregate counts through the REST API |
| Staging | does not exist yet (decision 1) | `launch-readiness.md` section 1 |

## Build status (2026-10-25)

What the build pass did, what is waiting on the owner, and what is still open. Checks run at the end: `tsc` exit 0 for api, office, seller and mobile; API tests 176 + 78 + 9 pass; shared tests 19 pass; Seller end to end 195 of 195; `locales:check`, `locales:keys`, `design:check`, `design:hex`, `design:cards` pass; `design:audit` 172 of 172 cards; api, office and seller `next build` pass (Office with type checking on); the web export bundles. Not run: the app in the simulator (the dev client could not reach Metro in this session; the bundle itself builds).

**Built:** A3 CI, A4 `.npmrc`, A5; C2, C3 (users status and verification worked only on paper: they always answered 401), C4, C5 (Office assigns all five roles), C6, C7, C8, C10; **two security fixes found on the way:** the admin KYC and receipt document routes signed file URLs even when the admin check failed (now behind permissions, audited, 5 minute links), and the Next.js critical advisories (upgraded to 16.4.3); D1, D6; E1 (46 errors, `ignoreBuildErrors` removed), E2 and E3 and E5 already existed; F1 (37 strings in six languages and a check), F2, F3 (raw colour guard), F4 (four new cards), F5, F7, F12 (filters moved to shared and tested, cart totals tested); G1 code (error reporting through the API, Sentry when a DSN is set), G2 code (heartbeats), G3 (request id), G4 review, G7 script, G8 review; B9 anon probe (`npm run db:rls-probe`); runbooks and the owner kit in `docs/runbooks`, store text in `docs/release`.

**Waiting on the owner:** everything in `docs/runbooks/owner-steps.md` (B0 to B4, B10 to B12, C1, C9, G1 DSN, G2 monitors, G5, G6, H, R). One new decision: the anon key can read `payment_methods`.

**Built since the first pass:** E4 (SQL file 21, Office Credentials tab, Seller status line), E6 (guided status moves, Retry needs `transactions.manage`, Refund needs `finance.manage`, both need a reason and are audited; bulk edits removed), E7 (`npm run test:office`, 38 pages, in CI); the login no longer flashes the PIN screen for users without a PIN.

**Still open (not built):** B6 baseline migration, B8 race tests (need staging), D2 to D5, F6 loading and empty state walk of all routes, F8, F9, F10, F11, G5, H, R.

## 2. How to read this plan

- **Owner** = only you can do it (accounts, Supabase SQL editor, legal sign-off, a network that reaches YooMoney). **Agent** = can be built and verified in a coding session.
- Sizes are rough: S under half a day, M about a day, L several days. They are estimates, not commitments.
- Every task has a **done when** that is a check someone can run. Nothing is "done" on a claim.
- Order matters: database first (the code and tests assume it), then API safety, then the apps, then device testing, then release.
- Money paths (checkout, refunds, payouts, ledger) change only with a test written first.

## 3. Milestones

| | Milestone | Exit criteria |
|---|---|---|
| **M0** | Clean base | All work committed; CI runs type-checks, tests and checks on every push; `npm ci` is the documented install |
| **M1** | Database matches the code | Files 1 to 20 applied on the test database; `verify-all.sql` returns no false rows; both seed checks true |
| **M2** | Safe to put staff on it | Office routes all permission-checked; Office type errors fixed and `ignoreBuildErrors` removed; env vars set; error tracking live; all suites green |
| **M3** | Customer app ready for devices | No untranslated strings; no stray colours; new features carded; YooKassa native built or consciously deferred; simulator walk-through clean |
| **M4** | Staff testing | Staging confirmed; test accounts and seed data; end-to-end scenarios (section 12) pass on one iPhone and one Android phone; findings triaged |
| **M5** | Pilot and release | `launch-readiness.md` go/no-go items met; EAS builds on TestFlight and a Play test track; store listing and privacy labels done |

## 4. Track A: housekeeping (do first)

| # | Task | Who | Size | Done when |
|---|---|---|---|---|
| A1 | Commit the pending working-tree changes: cart skeleton fix, dev warning filter, stale-test fix, `verify-all.sql` entry for communities, this plan | Agent | S | `git status` clean (excluding generated `ios/` and `android/`) |
| A2 | Review and commit or discard the other session's YooKassa edits (`withYooKassa.js`, `app/dev/yookassa-smoke.tsx`) | Owner + that session | S | Reviewed; committed or reverted |
| A3 | Add CI (GitHub Actions): `npm ci`, `tsc` for api, seller, office, mobile, `test:merchant`, `test:marketplace`, shared tests, `locales:check`, `design:check`, `design:cards` | Agent | M | A pull request shows all of these green |
| A4 | Document the install rule: use `npm ci` from the repo root. A global `legacy-peer-deps=true` hoists React Native next to React 18 and breaks the layout. Add `.npmrc` in the repo with `legacy-peer-deps=false` so it cannot recur | Agent | S | `.npmrc` committed; fresh clone installs correctly |
| A5 | Fix or retire `.claude/launch.json`: the old "web+api" entry points at the removed `web/` site | Agent | S | Entries start API, Seller, Office, mobile |

## 5. Track B: database and SQL (M1)

**Rules.** This database holds live Send customers (section 1), so: back up first and confirm the backup restores. Never run seeds, race tests or demo data against it. Run in the Supabase SQL editor, one file at a time, in this order. Every file is additive and safe to re-run. If one errors, stop and send the error text; each file is one transaction so nothing is half applied. Do not run `supabase/tests/marketplace-baseline.sql` against a remote project.

| # | File (`supabase/deploy/`) | Status on the test database | What it changes | Verify with |
|---|---|---|---|---|
| 1 to 16 | see `RUN-ORDER.md` | applied (probes passed) | seller platform, rate limits, Office queues, storefront details, support, send limits, push, account deletion, transfer events, reminders, payment expiry, slot alerts, quiet hours | `verify-all.sql` |
| **17** | `expert-main-category.sql` | **NOT applied** | adds `expert_profiles.main_category`, backfills every expert from category and headline | `select main_category, count(*) from expert_profiles group by 1;` shows no null row |
| **18** | `product-main-category.sql` | **NOT applied** | adds `hub_products.main_category`, backfills Food meal types and Mart categories | `select service_line_slug, main_category, count(*) from hub_products group by 1, 2;` shows no null category for food or mart |
| 19 | `marketplace-cron.sql` | **unknown** (needs a check, see B3) | schedules the marketplace worker with `pg_cron` and `pg_net` | `select * from cron.job;` lists the worker job |
| 20 | `store-communities.sql` | applied (probed) | `communities` on `merchants` and `hub_vendors` | `verify-all.sql` (entry added today) |

What 17 and 18 change for users: today the customer app guesses a product's or expert's category from its name in the app. After the files run, the category is stored, Office and Seller can set it, and the guess becomes a fallback. Until then, sellers cannot correct a wrongly guessed category.

| # | Task | Who | Size | Done when |
|---|---|---|---|---|
| B0 | **Back up the live database** (Supabase backup plus a schema-only `pg_dump`) and write down the time before any SQL runs | Owner | S | a backup exists and its time is noted |
| B1 | Run files 17 and 18, then `verify-all.sql` | Owner | S | `verify-all.sql` returns no row with `ok = false` |
| B2 | Run the second `verify-all.sql` query (seeded data): 8 or more reason templates, low-stock and document-expiry settings | Owner | S | all three columns true |
| B3 | Check the cron job: run `select * from cron.job;` and `select * from cron.job_run_details order by start_time desc limit 20;`; if empty, generate and run `marketplace-cron.sql` with `./scripts/marketplace-print-vault-cron.sh` (needs `MARKETPLACE_WORKER_SECRET` and `MARKETPLACE_TOKEN_KEY` set on the API) | Owner | S | the job exists and its last runs succeeded |
| B4 | **Create a separate staging Supabase project** (decision 1). The current project (`seeqjiebmrnolcyydewj`, from `api/.env`) is production. Write both refs in `docs/marketplace/release-gate-log.md`. Point every development and test run (API, Seller, Office, simulator, test builds) at staging, and keep production keys off developer machines | Owner | M | the gate log names both refs; dev `api/.env` points at staging |
| B5 | Apply the full migration chain twice on staging and diff the schema against production, per `launch-readiness.md` section 1 steps 1 to 6 | Owner + agent | M | second run has no errors and no diff |
| B6 | Close the baseline gap (WP0 in `api-and-data.md`): core tables (`users`, `transactions`, `hub_products`, `hub_vendors`, and others) exist only in `docs/marketplace/schema-baseline.json`, not in migrations. Either clone staging from production or write a baseline migration | Agent | L | an empty database can be built from the repo alone |
| B7 | Seed test data on **staging only**: fee rules with real numbers (placeholders 8, 6 and 12 percent are not decisions), hold days, send limits entered in Office, delivery zones for at least Moscow and Saint Petersburg (`marketplace_zones` was empty), 2 food stores, 1 mart, 2 experts, communities on the stores | Owner + agent | M | the pilot checklist in `launch-readiness.md` section 9 "Before" items are ticked |
| B8 | Concurrency gate: `scripts/marketplace-postgres-races.sh` against staging (last item, last slot, accept vs cancel, payment vs expiry, cart edit vs checkout). Add the two-connection payout tests from `launch-readiness.md` section 1 step 8 | Agent | M | all races pass |
| B9 | Test RLS as `anon` and `authenticated`: every table denies select, insert, update and delete; one merchant cannot read another's orders, earnings or documents (extend `api/tests/merchant/database.test.mjs`) | Agent | M | the extended test passes |
| B11 | **Set send limits on production now** (decision 5): Office, Send limits, enter the starting schedule. Until rows exist, sending is uncapped | Owner (compliance confirms) | S | `select count(*) from send_limits` is above 0 and Send shows the range |
| B12 | **Remove demo data from production** before real customers browse the marketplace: 18 demo products (`owner_team = 'demo'`) and the demo stores, using `supabase/deploy/demo-data-remove.sql` (it refuses to run if a real order or booking references them). Seed the same data on staging instead | Owner | S | `select count(*) from hub_products where owner_team = 'demo'` is 0 on production |
| B10 | Backup and restore rehearsal on a scratch project; write the reversing-entry procedure for the ledger | Owner + agent | M | a restore was done once and documented |

## 6. Track C: API (M2)

| # | Task | Who | Size | Done when |
|---|---|---|---|---|
| C1 | **Environment variables.** In `api/.env` add or set: `CORS_ALLOWED_ORIGINS` (exact origins for Seller, Office and the web build; no wildcard), `INTERNAL_API_SECRET`, `BITBANKER_TEST_CLIENT_ID` (sandbox), and the variables listed in `launch-readiness.md` section 2 that `env.example` still lacks (`MERCHANT_PAYOUT_KEY`, `TELEGRAM_*`, `NEXT_PUBLIC_SELLER_URL`). `MARKETPLACE_CHECKOUT_LINES` may stay empty (empty now means all lines allowed; the old doc says otherwise). Then update `env.example` | Owner (values) + agent (example file) | S | `env.example` matches the real variable set; no empty required variable |
| C2 | **Office route permissions.** 79 admin routes: 37 use `adminRoute(permission, ...)`, 27 use `requireAdmin` (any admin, no permission), 3 use `getAdminUser`, 2 use `requireSuperAdmin`, 10 are hand-rolled (list in Appendix C). Convert the 42 to the permission wrapper with the permission each one needs, and add the role-matrix test the plan in `office.md` section 2.1 calls for | Agent | L | a test fails if any admin route lacks a permission check |
| C3 | **Fix the two likely-broken routes** `admin/users/[id]/status` and `admin/users/[id]/verification`. They build a fresh database client with no cookies and call `auth.getSession()`, which should return no session, so they probably always answer 401. Confirm with a test, then move them to the wrapper | Agent | S | blocking a user and changing verification work in Office, with a test |
| C4 | Write `audit()` entries for converted routes (users status and verification, KYC decisions, transfers retry and refund, referral payouts, settings, admin users), per `office.md` section 2.2 | Agent | M | each converted write route has an audit test |
| C5 | Role assignment: `admin-users` only assigns `admin`; add role change with the full role set and a test | Agent | M | Office can assign ops, support, finance, compliance, super admin |
| C6 | Rate limits live on the surfaces in `launch-readiness.md` section 5 (auth, chat, search, checkout, reviews, uploads); `rate-limits.sql` is applied, confirm every listed route calls it | Agent | M | a test per surface shows the 429 |
| C7 | Webhook safety: YooKassa and Bitbanker verified by re-fetch or signature, deduplicated by event id, safe to replay and out of order (the section 6 "Idempotency and checkout" boxes) | Agent | M | the checked boxes carry test names |
| C8 | Remove the `MARKETPLACE_TOKEN_KEY` fallback for `MERCHANT_PAYOUT_KEY`; back up the payout key and test recovery | Owner + agent | S | fallback gone; recovery tested |
| C9 | Vercel: confirm the plan (cron needs Pro), regions, and that `api` previews point at staging Supabase; repoint or remove the stale root `vercel.json` (it still says Next.js with root `npm run build`, left from `web/`) | Owner | S | each Vercel project has a root, domain and environment documented |
| C10 | Contract safety: feature flags in `public-flags` for new customer features; no field removals (rules in `api-and-data.md` section 4) | Agent | S | a contract test fails on a removed field |

## 7. Track D: Seller

| # | Task | Who | Size | Done when |
|---|---|---|---|---|
| D1 | Fix the three failing Profile tests: add the missing mock for `/api/merchant/expert/credentials` in `seller/public/dev-mock.js` so the test does not call the real API, and set `CORS_ALLOWED_ORIGINS` for real use | Agent | S | `npm run test:seller` shows 195 of 195 |
| D2 | Verify the Seller communities picker on a real store profile: save, reload, see it in Office and in the customer filter | Agent | S | round trip proven with screenshots |
| D3 | Audit `seller.md` work packages against the code (the plan is dated 2026-10-17 and much has shipped): mark each built, partly built or open; open items become tasks here | Agent | M | `seller.md` has a current status column |
| D4 | Seller screens in every language: walk each screen in all six at 375 and 1280 wide for clipped or untranslated text | Agent | M | no clipped or English-only text |
| D5 | Seller alerts: confirm `cron/seller-notifications` runs, Telegram bot live, email deliverability (SES out of sandbox, SPF, DKIM, DMARC) | Owner + agent | M | a test order produces an email and a Telegram alert |
| D6 | Make sure `NEXT_PUBLIC_SELLER_MOCK` is unset outside local review, with a build check that fails if it is set in production | Agent | S | the check exists and passes |

## 8. Track E: Office

| # | Task | Who | Size | Done when |
|---|---|---|---|---|
| E1 | Fix the 46 type errors (Appendix B), then remove `ignoreBuildErrors: true` from `office/next.config.mjs`. Real bugs hide here: `ExchangeRate.fee` is read but not typed, and 14 errors are in `utils/currency.ts` | Agent | M | `tsc` exit 0 and the build passes with the flag removed |
| E2 | Permission-aware navigation and actions: hide what a role cannot do (support must not see finance), per `office.md` section 2.1; depends on C2 | Agent | M | each role walk-through shows only its screens |
| E3 | Listing-change review queue (products and services in review), claim and owner, SLA | Agent | L | a seller edit appears in Office, can be approved or rejected with a reason template |
| E4 | Expert credential review and approval status | Agent | M | credentials can be approved or rejected |
| E5 | Show and edit product and expert main categories in Office after SQL 17 and 18 | Agent | S | changing a category in Office changes the customer app |
| E6 | Replace bulk transaction status edits with role-based Retry and Refund (`office.md` row OfficeTransactions) | Agent | L | status edits removed; refund needs a role and reason |
| E7 | Add a smoke test for Office like Seller has (login, each main page renders at 1280 wide with no console errors) | Agent | M | `npm run test:office` exists and is in CI |
| E8 | Defer, per `office.md`: compliance case workflow (needs tables that do not exist) | n/a | n/a | recorded as post-pilot |

## 9. Track F: customer app (M3)

| # | Task | Who | Size | Done when |
|---|---|---|---|---|
| F1 | **Translate the 40 strings** that exist only as English fallbacks (Appendix A) into en, ru, fr, es, zh, pt. They cover cart, product card, order view, verification sheet, pay widgets, directory filters. Add a test that fails when a `t("key", { defaultValue })` has no locale entry | Agent | M | the check lists 0 missing keys |
| F2 | **Service line titles and descriptions** (Food, Mart, Transfer, Experts, "Have all your cravings") come from the database and appear only in English. Add per-language copy to the service-line data, with Office editing, and read it in the app | Agent | M | the Home tiles change with the app language |
| F3 | Replace the remaining 83 hard-coded hex colours in 14 files with design tokens (largest: `tile.tsx`, `home-slider.tsx`, `avatar.tsx`, `auth-chrome.tsx`; the YooKassa web widget colours are third-party and may stay) | Agent | M | the count outside `lib/theme.ts` and documented exceptions is 0 |
| F4 | Design cards for what shipped without one: location picker, community filter, "All" lists with search and filters, docked tab bar, cart dot, language hero slide. Update card READMEs and previews | Agent | M | `design:cards` passes with the new cards |
| F5 | Run the visual audit `npm run design:audit` (needs Playwright's Chromium) and fix the drift it reports | Agent | M | the audit shows no new failures |
| F6 | **Empty and loading states pass:** every screen that fetches must show a skeleton that is visible (the cart's was invisible), an error state with retry, and an empty state. Walk all 57 routes with the API slow, down and empty | Agent | L | a checklist per route, with screenshots |
| F7 | **Language correctness:** device-language follow is built. Decided: Simplified Chinese only, Brazilian Portuguese. Add a test that `zh-Hant` and `pt-PT` devices get `zh` and `pt` | Agent | S | the test passes |
| F8 | Native-speaker review of the agent-written translations in `strings-to-review.md` (8,900 lines; regenerate first with `node scripts/list-strings-to-review.mjs`) | Owner | L | reviewers signed per language |
| F9 | **YooKassa native build.** The SDK servers (`git.yoomoney.ru`, `nexus.yoomoney.ru`) do not answer from the build machine, so the native module has never been built. Run `eas build --profile development` for iOS and Android, or build from a network that reaches them. A ready prompt for that session exists. Then test the sheet in YooKassa sandbox, never with real cards | Owner (network, Expo login, accounts) + agent | L | both builds succeed; a sandbox payment completes in the native sheet on iOS and Android |
| F10 | Accessibility pass: text at 200 percent, tap targets 48px, focus order, screen-reader labels on icon buttons (the cart dot keeps its count in the label) | Agent | M | a checklist run on the main flows |
| F11 | Android pass: the app has only run on the iOS simulator. Run it on an Android emulator and a phone: tab bar, sheets, keyboard, back gesture, push | Agent + Owner | L | main flows work on Android |
| F12 | Unit tests for pure logic that has none: communities filter, location filter, cart totals, language pick (done), money format | Agent | M | tests for each exist and run in CI |

## 10. Track G: cross-cutting (M2 to M5)

| # | Task | Who | Size | Done when |
|---|---|---|---|---|
| G1 | **Error tracking** on API, Seller, Office and mobile (Sentry or equivalent), with request id, route and a hashed user id, no PII, KYC and payout bodies scrubbed | Owner (account) + agent | M | a forced error appears in the dashboard from each app |
| G2 | **Alerts and heartbeats** (`launch-readiness.md` section 4): worker heartbeat, outbox age, failed jobs, ledger invariant, stale rates, 5xx, plus a dead-man ping on each cron | Owner + agent | M | a deliberate failure pages the named channel |
| G3 | Structured logs with request id and route, retention stated | Agent | M | logs carry the ids |
| G4 | Document handling review (`launch-readiness.md` section 7): private buckets verified, signed URL access logged, retention, upload checks | Agent + Owner | L | each bullet has evidence |
| G5 | Legal copy (`launch-readiness.md` section 8): Terms, Privacy, seller agreement, payout terms, KYC limits copy, refund policy, referral terms, 54-FZ receipt owner. Replace placeholder numbers with Office values | Owner (counsel) | L | signed copy exists in six languages |
| G6 | Staff security: Office accounts with MFA, least-privilege roles, offboarding checklist | Owner | S | MFA enforced |
| G7 | Load test staging with realistic traffic on browse, search, checkout | Agent | M | the section 5 limits hold under load |
| G8 | Dependency hygiene: lockfile checked in, `npm audit` reviewed, deprecation warnings triaged (NativeWind still triggers React Native's `ImageBackground` warning; revisit when it updates) | Agent | S | a dated review |

## 11. Track H: environments and devices

| # | Task | Who | Size | Done when |
|---|---|---|---|---|
| H1 | Staging environment: separate Supabase project, Vercel projects for api, seller and office pointing at it, an app build configured for it | Owner + agent | M | the staging app signs in and orders against staging only |
| H2 | Test accounts: one customer per language, one store owner, one expert, one of each Office role; documented outside the repo | Owner | S | list exists |
| H3 | Device matrix: one recent iPhone, one small iPhone (SE class), one mid-range Android, one tablet or large web window | Owner | S | devices available |
| H4 | Push notifications on a real iOS and Android build (the simulator lacks the Keychain entitlement and logs an error): order status, chat, support reply, booking reminder, transfer events | Owner + agent | M | each push arrives once, in the right language |
| H5 | Deep links: `app.ciuna.com` and `m.ciuna.com` associated domains verified for iOS and Android | Owner | M | a shared store link opens the app |

## 12. End-to-end test scenarios (M4)

Run on staging with the device matrix. Each scenario names its expected result; record pass or fail with a screenshot.

1. **Sign up and sign in** in each language; PIN set and unlock; biometric; sign out everywhere.
2. **Language:** device in Chinese, Russian, French, Spanish, Portuguese and a language we do not support (expect English); change language in the app and confirm it sticks after restart and on another device after sign-in.
3. **Send money:** verification, limits enforced, quote, pay, payment window and cancel, receipt PDF, transfer events and pushes.
4. **Food order, pickup and delivery:** location city filter, community filter, store hours and closed store, minimum order, cart, checkout in the native YooKassa sheet and the web widget, seller accepts, order timeline, chat, review.
5. **Mart order:** same, plus digital goods.
6. **Expert booking:** slot picker in two time zones, booking confirmation with join link, reminder push, "Notify me" when no slots, cancellation.
7. **Support:** new request, reply from Office, push, resolve.
8. **Account deletion:** blocked while an order is active; request, restore from Office, scheduled removal.
9. **Seller:** application, KYB documents, approval in Office, catalog with categories and communities, accept and fulfil an order, payout request, finance marks paid, ledger balances.
10. **Office:** each role sees only its screens; every write appears in the audit log.
11. **Failure modes:** API down, slow network, offline, payment webhook delayed, payment after cancel.
12. **Refund and cancel rehearsal** with the ledger invariant query before and after.

## 13. Release track (M5)

| # | Task | Who | Size | Done when |
|---|---|---|---|---|
| R1 | Apple and Google developer accounts connected to EAS | Owner | S | `eas credentials` shows both |
| R2 | EAS production builds for iOS and Android (with YooKassa), a development build for the team | Owner + agent | M | installable builds exist |
| R3 | TestFlight and Play internal test tracks with staff | Owner | M | staff install and sign in |
| R4 | Store listing: name, description in six languages, screenshots, icon, age rating, support and privacy URLs | Owner + agent | M | listing complete in both stores |
| R5 | Privacy labels and data safety forms (data collected: identity documents, contact, payments, usage) | Owner + agent | M | forms submitted |
| R6 | Account deletion reachable in the app and described in the store review notes (a store rule; already built) | Agent | S | reviewer path documented |
| R7 | Review demo account and notes for the app stores | Owner | S | account and notes ready |
| R8 | Pilot: enable `food` only for staff, then add lines per `launch-readiness.md` section 9; stop conditions and a named decision owner | Owner | M | pilot run with daily review |
| R9 | Rollback rehearsal on staging (`launch-readiness.md` section 10) | Owner + agent | M | one rollback done and written up |
| R10 | Go / no-go meeting against `launch-readiness.md` section 11 | Owner | S | decision recorded |

## 14. Decisions (made 2026-10-25)

Product decisions taken for Ciuna, with the reason. Change any of them in this table and the plan follows.

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | Is the database staging or production? | **Production.** Create a separate staging project and move all development and testing there (B4). | Fourteen months of transfers from 17 real senders. Test seeds, race tests and demo data on it could touch live customers' money. |
| 2 | Chinese variant | **Simplified Chinese only at launch.** Traditional-script devices map to Simplified (already built). Add Traditional only when usage asks for it. | The core Chinese audience (students and workers in Russia) reads Simplified. A second variant doubles review work for a small group. The planned chat translator targets Simplified. |
| 3 | Portuguese variant | **Brazilian Portuguese.** The strings already use it (125 uses of "você", "sua", "seu", none of the European forms) and the app uses the Brazil flag. Keep wording neutral so Lusophone Africa and Portugal also read it comfortably. | One reviewer, one voice. Revisit if Angola, Mozambique or Portugal become a large share of users. |
| 4 | Delivery zones for the pilot | **Moscow only.** Each pilot store sets its own zones in Seller, starting with 3 to 5 districts it can reach in about an hour. Saint Petersburg opens after Moscow runs cleanly for a few weeks. A store with no zone is pickup only (already built). | The stores know where they can deliver. One city halves the support and logistics risk. |
| 5 | Fees, hold days, limits | **Use the numbers already decided in `design-system/guides/80-decisions.md`:** commissions food 8 percent, mart 6, experts 12; hold 3 days after completion for goods and 2 days after the session for experts; minimum payout ₽1,000; **payout fee 0 percent at launch** (the guide says 1 percent in one line and 0 percent in another; 0 wins: it removes friction while we recruit sellers, and the setting is built so it can be turned on later). **Send limits** (enter in Office now, B11): minimum ₽1,000 per transfer; Level 1 (email and phone) up to ₽50,000 per transfer and ₽50,000 a month; Level 2 (government ID) up to ₽300,000 per transfer and ₽600,000 a month; Level 3 (ID plus address proof) up to ₽600,000 per transfer and ₽2,000,000 a month. | Today sending has no cap. These are the design card values with per-transfer caps added, and a deliberately conservative start. They are a starting schedule for compliance to confirm or lower, not legal advice. |
| 6 | Reviewers and on-call | **Translation review:** Russian by the Russian-speaking staff; French, Spanish, Portuguese and Chinese by one paid native reviewer each, recruited from the community the language serves. **Pilot roles:** you are the decision owner (stop or go); one engineer on call; one named person reads the support inbox; one named person in finance handles payouts. | Native review is the only way to catch tone problems. Four named roles make the stop conditions in `launch-readiness.md` section 9 actionable. |
| 7 | Monitoring | **Sentry** for all four apps, PII off by default (`sendDefaultPii` false), KYC and payout bodies scrubbed, one project per app. Uptime checks with a free monitor (UptimeRobot or Better Stack). The account is owned by you under a company email. | One tool covers React Native, Next.js and Node. Scrubbing keeps personal data out. A single owner avoids an orphaned account. |
| 8 | Where to build YooKassa native | **Try EAS first** (one development build per platform). If it fails with a network error, build Android on a small Linux server in Russia and iOS on a Mac using a Russian network. **The pilot does not wait for it:** native users pay through the web widget and the browser payment page (`/pay/[transactionId]`, already built); the in-app native sheet ships before public launch. | The native SDK servers are not reachable from our current network. A payment path that works today beats a nicer one that is blocked. |

**Task changes from these decisions:** B0, B4, B7, B11 and B12 (live database), F7 (settled), F9 (the pilot can run without the native sheet), G1 (Sentry).

## 15. Suggested order of work

1. **Now, in parallel:** B0 then B1 and B2 (you), B11 (you, with compliance), A1 to A5 (agent), C1 (you set values), F1 (agent), D1 (agent).
2. **Next:** C2, C3, E1 and E2 together (they touch the same routes and screens), plus G1.
3. **Then:** F2 to F6 and F12, B4 to B10, H1 to H3.
4. **Then:** F9 (YooKassa native), H4, F11, then the end-to-end pass in section 12.
5. **Last:** G4, G5, R1 to R10.

## Appendix A: strings that exist only as English fallbacks (40)

| Key | English text | Used in |
|---|---|---|
| `auth.invalidCredentials` | Invalid email or password | `app/auth/login.tsx` |
| `common.back` | Back | `app/(app)/hub/[slug]/c/[category].tsx` |
| `common.clear` | Clear | `app/experts/browse.tsx` |
| `common.loading` | Loading | `app/recipients/index.tsx` |
| `common.retry` | Retry | `app/orders/[id].tsx` |
| `experts.card.minutes` | {{count}} min | `components/expert-catalog.tsx` |
| `hub.cart.addFailed` | Couldn't add to cart | `lib/use-guarded-add.tsx` |
| `hub.cart.addToCart` | Add to cart | `components/product-card.tsx` |
| `hub.cart.decrease` | Decrease quantity | `app/(app)/hub/[slug]/cart.tsx` |
| `hub.cart.empty` | Your cart is empty. | `app/(app)/hub/[slug]/cart.tsx` |
| `hub.cart.increase` | Increase quantity | `app/(app)/hub/[slug]/cart.tsx` |
| `hub.cart.itemCount` | {{count}} item | `components/hub-cart-bar.tsx` |
| `hub.cart.moreFromVendor` | More from {{vendor}} | `app/(app)/hub/[slug]/p/[productId].tsx` |
| `hub.cart.remove` | Remove item | `app/(app)/hub/[slug]/cart.tsx` |
| `hub.cart.title` | Cart | `app/(app)/hub/[slug]/cart.tsx` |
| `hub.cart.updateFailed` | Couldn't update cart | `app/(app)/hub/[slug]/p/[productId].tsx` |
| `hub.cart.viewCart` | View cart | `components/hub-cart-header-button.tsx` |
| `hub.checkout.onlinePayInlineHint` | Complete payment by card or SBP below. | `components/checkout-pay-rails.tsx` |
| `hub.checkout.orderLabel` | Order | `app/orders/[id].tsx` |
| `hub.checkout.paidOnline` | Complete payment | `app/orders/[id].tsx` |
| `hub.checkout.payManual` | Bank transfer | `components/checkout-pay-rails.tsx` |
| `hub.checkout.payOnline` | Pay online | `components/checkout-pay-rails.tsx` |
| `hub.checkout.paymentMethod` | Payment method | `app/orders/[id].tsx` |
| `hub.expertsEmpty` | No experts listed yet. | `app/experts/browse.tsx` |
| `hub.pay.failed` | Payment failed. Please try again. | `components/yookassa-checkout-widget.web.tsx` |
| `hub.pay.loading` | Loading secure payment… | `components/marketplace-pay-step.tsx` |
| `hub.pay.missingToken` | This payment link has expired. | `components/yookassa-checkout-widget.web.tsx` |
| `hub.pay.success` | Payment received. | `components/yookassa-checkout-widget.web.tsx` |
| `hub.pay.widgetError` | Payment could not be started. | `components/yookassa-checkout-widget.web.tsx` |
| `hub.soldOut` | Sold out | `app/(app)/hub/[slug]/p/[productId].tsx` |
| `hub.vendorProductCount` | {{count}} products | `components/store-header.tsx` |
| `reviews.count` | {{count}} reviews | `components/product-card.tsx` |
| `txDetail.loadFailed` | Couldn't load this transfer | `app/orders/[id].tsx` |
| `txDetail.loadFailedHint` | Check your connection and try again. | `app/orders/[id].tsx` |
| `verification.kycBridge.inAppSecureBody` | For security, our verification partner opens verification in a protected window. Finish KYC there — this screen stays open and updates when you’re verified. | `components/bitbanker-kyc-sheet.tsx` |
| `verification.kycBridge.inAppSecureTitle` | Continue securely with our partner | `components/bitbanker-kyc-sheet.tsx` |
| `verification.kycBridge.openPartner` | Open verification | `components/bitbanker-kyc-sheet.tsx` |
| `verification.kycBridge.opening` | Opening… | `components/bitbanker-kyc-sheet.tsx` |
| `verification.kycBridge.refreshAfter` | I’ve finished, check status | `components/bitbanker-kyc-sheet.tsx` |
| `verification.kycBridge.waitingPartner` | Waiting for verification… | `components/bitbanker-kyc-sheet.tsx` |

## Appendix B: Office type errors by file (46)

`utils/currency.ts` 14, `components/settings/office-rates-panel.tsx` 6, `lib/office-data-store.ts` 3, `lib/kyc-service.ts` 2, `components/hub/office-hub-products-view.tsx` 2, `app/kyc/page.tsx` 2, and one or two each in the layouts for `users`, `transactions`, `settings`, `referrals`, `kyc`, `dashboard`, `compliance` (`robots: noindex` is not a valid option), `components/ui/progress.tsx`, `components/ui/accordion.tsx`, `app/experts/profiles/page.tsx`.

## Appendix C: admin routes not on the permission wrapper (42)

- **Hand-rolled login check (10):** `admin/kyc`, `admin/users/[id]`, `admin/users/[id]/status`, `admin/users/[id]/verification`, `admin/audit/export`, `admin/marketplace/catalog`, `admin/marketplace/orders`, `admin/marketplace/orders/[id]`, `admin/marketplace/orders/[id]/actions`, `admin/marketplace/jobs/[id]/retry`.
- Of those, `users/[id]/status` and `users/[id]/verification` use a cookie-less `auth.getSession()` and likely always return 401 (C3).
- **`requireAdmin`, any admin and no permission (27)**, **`getAdminUser` (3)**, **`requireSuperAdmin` (2):** list them with `grep -L adminRoute $(find api/app/api/admin -name route.ts)`.

## Appendix D: environment variable gaps (names only)

In `env.example` but absent from `api/.env`: `EXPO_PUBLIC_*` (mobile, set in `mobile/.env`), `INTERNAL_API_SECRET`, `CORS_ALLOWED_ORIGINS`, `BITBANKER_TEST_CLIENT_ID`. Present but empty: `MARKETPLACE_CHECKOUT_LINES` (fine). Missing from `env.example` per `launch-readiness.md`: `MERCHANT_PAYOUT_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `NEXT_PUBLIC_SELLER_URL`.

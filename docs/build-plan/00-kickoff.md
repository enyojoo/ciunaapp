# Kickoff: build the design into the apps

Use this to start a new session. Paste the prompt at the bottom.

## Read in this order
1. `docs/design-to-build-plan.md`: the five stages (A to E) and the order of work.
2. `design-system/guides/80-decisions.md`: every product decision is made; do not reopen them.
3. The surface plan for the package you pick:
   - `docs/build-plan/api-and-data.md` (WP0 to WP13)
   - `docs/build-plan/office.md` (O0 to O12)
   - `docs/build-plan/seller.md` (P0 to P11)
   - `docs/build-plan/customer-app.md` (WP1 to WP13, native `mobile/` and web `web/`)
   - `docs/build-plan/send.md` (S0 to S7)
   - `docs/build-plan/launch-readiness.md`
4. The card you are building: `design-system/components/<Name>/preview.html` and README (its Upgrade section says Built, differs or New). Viewer: `design-system/viewer.html`.

## Progress (updated at the end of the first build session)
Done and committed:
- A3 (done): `zh` and `pt` are in `mobile/lib/i18n.ts`, `web/lib/i18n/config.ts`, `web/lib/auth-context.tsx`, `web/lib/database.ts` (type), both language pickers (`mobile/components/language-picker.tsx`, `web/components/i18n/language-picker.tsx`) and the `languages.*` names in all six `common.json`. `users.preferred_language` is a plain text column, no migration needed.
- V3 (done): `npm run locales:check` prints `locales ok`; the 27 missing es/fr/ru keys were filled.
- A5 (half done): Seller phone nav is now 4 items plus More for stores and experts (`seller/components/shell/nav.ts`), and More reaches Earnings, Reviews and Availability. Still to do for A5: the Playwright harness and the 375px test.
- A7 (done for Seller alerts): `renderAlert` adds the Ciuna logo and shows booking times in the business's operating-country zone with a label (e.g. `20 Oct 12:00 MSK`), via `zoneForCountry` in `api/lib/merchant/notify-messages.ts`; tests updated and passing. No schema change: a per-user `users.time_zone` is the later upgrade. Customer emails still need the same treatment.
- A6 (started): migration `supabase/migrations/20261017100000_rate_limits.sql` (copy for the SQL editor: `supabase/deploy/rate-limits.sql`, tested twice on a local Postgres: allows N then blocks, idempotent), helper `api/lib/rate-limit.ts` (`rateLimit`, `clientIp`, `LIMITS`; fails open if the function is missing), applied to `GET /api/hub/search` (429 with `Retry-After`). Chat already limits at 30 per hour (`lib/merchant/messages.ts`). `marketplaceRoute` now takes an optional per-user limit (`api/lib/marketplace/http.ts`; applied to checkout 10/min and review submit 20/min; denied admin calls return 403). Still to apply: auth, uploads, favourites, cart. Owner action: run `supabase/deploy/rate-limits.sql` in the SQL editor.
- A2 (started, secure by default): `requireAdmin` (`api/lib/admin-auth-utils.ts`) now checks a permission derived from the request path and method for the legacy routes (`legacyAdminPermission` in `api/lib/admin-roles.ts`: rates, currencies, settings, transactions, users, assistant, expert, hub, referral payouts, process-completion, send-email-notification), so a `support` user can no longer change rates, settings or payouts, and `finance` owns rates. New permissions: users.read/manage, rates.manage, settings.manage, transactions.manage, catalog.manage, experts.manage. The legacy role `admin` keeps full access until Office assigns roles (so nobody is locked out). Test: `api/tests/merchant/admin-legacy-permissions.test.ts`. `GET /api/admin/me` is built (`api/app/api/admin/me/route.ts`: role, legacy flag, permission list; legacy `admin` is reported as `super_admin`). Legacy handlers now return 403 (not 500) when the role matrix denies access (28 route files catch `AdminForbiddenError`; `withErrorHandling` maps it too). Still to do for A2: replace the path map with explicit `adminRoute(permission)` per route over time; `office/lib/permissions.tsx` (`usePermissions`, `<Can permission=...>`, built, not yet used on pages: wrap the Office controls per `docs/build-plan/office.md` O2); role-change endpoint; audit rows from legacy mutations; a scan test that fails when an admin route has no permission.
Follow-ups found while doing it:
- Customer emails (`api/lib/email-notification-service.ts`, `normalizeLocale`) only support en, ru, fr, es; zh and pt fall back to English. Add zh and pt templates (part of A7 and send S5).
- Provider names were removed from the six locale files (Bitbanker, IIDX, Sumsub in `send.*` and `verification.*`). Check the customer screens and `web`/`mobile` code for any hard-coded provider name (grep `Bitbanker` in `mobile/app`, `mobile/components`, `web/components`).
- Pre-existing TypeScript errors in `mobile` (`sceneContainerStyle`, `app-text-input.tsx`) and `web` (`auth-context.tsx`, `i18n/config.ts`) were present before this work; clear them in A4.
Remaining in Stage A: A1, A2, A4, A5 harness, A6 (apply to the other routes), A7 (customer emails), V1, V2, V4.

## Stage A task list (start here; items are independent unless noted)
| # | Task | Plan section | Exit test |
| --- | --- | --- | --- |
| A1 | Data baseline: capture the live Supabase schema into one baseline migration (`supabase db dump --schema public --linked`, or the owner pastes a schema-only dump if the CLI is not linked) for the core tables with no DDL in the repo; CI Postgres job applies the chain twice. Also confirm the marketplace cron and vault SQL (`supabase/deploy/marketplace-cron.sql`) has been run. | api-and-data WP0 | `npm run test:db` green; schema dump identical on second apply; baseline lists every table the API reads |
| A2 | Permission model: one matrix, `GET /api/admin/me`, convert legacy admin routes to `adminRoute(permission)`, client `<Can>` | api-and-data WP1, office O0 | matrix test: each role gets 403 or 200 per route |
| A3 | Wire `zh` and `pt` into the language lists (`mobile/lib/i18n.ts`, `web/lib/i18n/config.ts`, `web/lib/auth-context.tsx`) | customer-app WP1 | six languages selectable on native and web, strings render |
| A4 | Shared UI primitives and one status vocabulary (`packages/ui-web`, mobile status chip from tokens) | customer-app WP2, seller P3, office O3 | `design:check`, `design:cards`, `tsc` green |
| A5 | Seller test harness (Playwright on mock mode) and the 5-item phone nav fix | seller P0, P1 | 375px: 5 nav items, More reaches Earnings and Reviews |
| A6 | Rate limits (auth, chat, search, checkout, uploads) | api-and-data WP6 | burst test returns 429 with `Retry-After` |
| A7 | Seller alert emails: logo and recipient time zone | seller P2 | notify tests updated and green |

### Verification tasks (what used to be listed as risks; each has an owner task and a gate)
| # | Task | How | Gate |
| --- | --- | --- | --- |
| V1 | Prove the 7 Seller migrations against the real schema before the owner runs them | After A1 produces the baseline dump, restore it into a local Postgres (Docker `postgres:15`, or PGlite loaded with the dump) and run `supabase/deploy/seller-portal-all.sql` on it; fix any column or constraint mismatch in the migration files and regenerate the file | Combined file runs clean twice on the restored real schema; backfill counts match (`merchant_id is null` = 0 for vendors and products); report to the owner that the file is verified |
| V2 | Rendering check for every design card | Add `design-system/scripts/audit-cards.mjs` (Playwright, installed with Seller P0): open each card at its header width, fail on horizontal overflow, page taller than its header `height`, console errors, and missing images; save a screenshot per card to a gitignored folder | `npm run design:audit` green on all cards; wire into CI |
| V3 | Locale completeness | `npm run locales:check` (`scripts/check-locales.mjs`, already in the repo) compares every language with English for missing keys, empty values and placeholder mismatches. It currently reports 27 missing keys in es, fr and ru (zh and pt are complete) (`send.mobile.swapCurrencies`, `verification.kycBridge.*`). Fill them (translate with the Azure provider through a one-off script, review diff), then add every new string from the plan to all six languages in the same change | `npm run locales:check` prints `locales ok`; runtime falls back to English for a missing key and logs it in development |
| V4 | Strings written by agents (ru, zh, pt) | Treat the locale files as the single source: they improve by editing JSON, no code change. The session creates `docs/build-plan/strings-to-review.md` listing the agent-written strings with file and key, and re-run V3 after edits | List exists; no blocker for release |

Then Stage B (see master plan).

## Owner actions that only the Supabase owner can do
1. Back up, then run `supabase/deploy/seller-portal-all.sql` in the SQL Editor and send back the verify results (the build assumes these 7 migrations are applied; until then Seller and Office merchant features fail against the database).
2. Run `supabase/deploy/marketplace-cron.sql` if not done.
3. Create provider credentials when ready: Azure Translator, Expo push. Do not block on them; code uses fakes in tests.

## Settled (do not ask)
Numbers are Office-editable seeds, translation is Azure AI Translator, Telegram is built but off until a bot token exists, account-deletion wording is final. See the end of `design-system/guides/80-decisions.md`. There is one Supabase project (production): apply SQL with a backup first (`supabase/deploy/seller-portal-all.sql`), never assume a staging copy.

## Working rules
- The card is the contract. If the card is wrong, fix the card first, then the code.
- Numbers on cards are samples; read them from Office or the database.
- Native apps in stores cannot be force-updated: additive API changes only, checkout and payment contracts frozen, new screens behind flags.
- No provider names on customer or Seller screens; Office only.
- Each package ends with its exit test, `npm run design:check` and `npm run design:cards`, and a screenshot next to the card. Then change the card's Upgrade line to "Built".
- Do not build items listed under "Do not build yet" in the plans.
- Run independent packages as separate sessions in separate worktrees; they touch different files.

## Prompt to paste into the new session
```
Work in /Users/a1/Projects/ciunaapp. Read docs/build-plan/00-kickoff.md, then docs/design-to-build-plan.md and design-system/guides/80-decisions.md. Execute Stage A of the plan: tasks A1 to A7 and verification tasks V1 to V4 (V1 right after A1), using the surface plans in docs/build-plan/ for detail. Decisions are already made; do not ask about them. Follow the working rules in the kickoff file. Start with A1 and A2 (API and data), run A3 to A7 as parallel work where files do not overlap, verify each with its exit test, commit per task, and report what is done, what failed, and anything that needs an outside input (only provider keys: Azure Translator, Expo push; Telegram is deferred).
```

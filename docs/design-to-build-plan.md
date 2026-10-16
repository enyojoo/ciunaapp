# Design to build plan

The design system (`design-system/`, viewer at `viewer.html`) is the approved target. This plan turns it into working apps: Office, Seller, the Expo native app and customer web, on one API. Read with `design-system/guides/80-decisions.md`. Detail lives in `docs/build-plan/`:

| File | Covers |
| --- | --- |
| `build-plan/api-and-data.md` | API, database, versioning (WP0 to WP13) |
| `build-plan/office.md` | Office (O0 to O12) |
| `build-plan/seller.md` | Seller (P0 to P11) |
| `build-plan/customer-app.md` | Expo native and customer web (WP1 to WP13) |
| `build-plan/launch-readiness.md` | Staging, env, security, pilot, go/no-go |

Rules for everything below:
- A card's **Upgrade** section is the contract: "Built" means no work, "New" means a proposal that needs the product decision listed in the surface plan before it is built.
- Numbers drawn on cards are placeholders (decisions guide). Read them from Office settings or the database; never hard-code them.
- Native apps in stores cannot be force-updated: API changes are additive, checkout and payment contracts stay frozen, new screens sit behind flags (api-and-data.md section 4).
- Every package ends with its exit test, a `design:check` and `design:cards` pass, and a screenshot or Playwright run compared with the card.

## Stages (dependency order)

### Stage A: foundations (nothing user-visible depends on a screen yet)
Run in parallel; they touch different files.
1. **Data baseline (API WP0).** Baseline migration for the 17 tables with no DDL plus `hub_products` and the other core tables; CI job on a real Postgres applying the chain twice. Confirm which Supabase project is staging first (launch-readiness gate 1).
2. **Permissions (API WP1 = Office O0).** Permission matrix in one place, `GET /api/admin/me`, convert the ~40 legacy admin routes to `adminRoute(permission)`, role matrix test. This closes a live hole: any admin role can reach KYC, users, transactions, rates and settings today.
3. **Language wiring (customer WP1).** Add `zh` and `pt` to `mobile/lib/i18n.ts`, `web/lib/i18n/config.ts`, `web/lib/auth-context.tsx`; strings already exist in `packages/shared/src/locales`.
4. **Shared UI primitives.** Extend `packages/ui-web` (NoAccess, FileDrop, DueTimer, RatingStars, Stepper, DataTable, SidePanel, ReasonDialog, AgeSla); mobile primitives for status vocabulary, PriceTag, RatingStars, chips (customer WP2, Seller P3, Office O3). One status vocabulary from `tokens.json` replaces hard-coded hex in `mobile/components/status-chip.tsx`.
5. **Seller test harness and nav fix (P0, P1).** Playwright against `NEXT_PUBLIC_SELLER_MOCK=1`; fix the phone nav (it shows 6 slots; Earnings and Reviews unreachable on a phone).
6. **Rate limits (API WP6)** and **email logo and time zone (Seller P2)**: independent, small.

Exit for stage A: migration chain reproducible, matrix test green, six languages selectable on native and web, Seller smoke tests green at 375, 768, 1280.

### Stage B: first user-visible slice (APIs that exist but no client calls)
1. Customer: favourites, search, order chat, reviews, order cancel (customer WP5, WP8; endpoints exist).
2. API field additions (API WP3 partial, customer WP4): vendor cover, hours, delivery zones, minimum order; expert languages, next slot, timezone.
3. Seller: Home (needs-you list, today's earnings), orders and bookings polish, messages and reviews desktop (P4, P5, P9).
4. Office: shell and nav with role-aware hiding, audit coverage, merchant queue with claim and SLA (O1, O2, O5).

Exit: a customer can search, favourite, order, chat and review against staging; a seller sees it; an Office user without the permission cannot.

### Stage C: money and catalog quality
1. Seller money screens and catalog desktop (P6, P7, P8).
2. Office finance polish, listing review and catalog queue (needs API WP2 reason templates and catalog reviews), orders and exception queue with refund by role (needs API WP5), bookings (O6, O7, O8).
3. Customer store and product pages, cart and checkout, experts, activity (WP6, WP7, WP9, WP10).
4. Payout hardening (API WP13): card-number rejection, four-eyes approval, attempts table.

### Stage D: after product decisions
Customer KYC levels and limits (API WP3), support threads and assistant (WP9), push (WP8), chat translation (WP7), referral progress (WP10), Seller team and expert extras (P10, P11), Office dashboard, Cmd-K, users, KYC, referrals, rates (O9 to O11), rates approval and maintenance (API WP4), receipts and account deletion (WP12).

### Stage E: launch
Follow `launch-readiness.md`: staging migration order, env vars (`MERCHANT_PAYOUT_KEY`, Telegram, `NEXT_PUBLIC_SELLER_URL`), Vercel Pro and crons, Supabase `pg_cron`, monitoring, money-path review, document retention, pilot with five merchants, rollback, go/no-go.

## Do not build yet
Unconfirmed "New" items: in-app support chat and the conversational assistant, expert "Notify me" and intro-video slot, "Withdraw via Ciuna Send" (disabled row only), compliance case workflow, booking disputes, listing health card, global search. Every number on a card is a placeholder.

## Decisions needed from you before the stages that use them
1. Office permission table per role (blocks Stage A item 2 wording, not the work).
2. KYC levels and limits, and the compliance provider (Stage D).
3. SLA targets per queue (O5).
4. Listing-review scope and rejection templates (Stage C).
5. Seller More as a sheet or a page; low-stock threshold; email time zone (Seller).
6. Expert credentials, spoken languages, intro video (P11).
7. Real commission, hold-day, payout-minimum and referral numbers, entered in Office before the first merchant is approved.
8. Chat translation provider and push provider (Stage D).
9. The 14 open customer questions in `build-plan/customer-app.md` section 6 (Support and Assistant are blocked on them).

## How to run it
- One owner per surface and per stage item; packages inside a stage touch different files and can run as parallel sessions in separate worktrees.
- Per package: read the card and README, build to the card, run its exit test, capture a screenshot next to the card, update the card's Upgrade line from "New" to "Built".
- Keep `design-system/` the single source: if build shows a card is wrong, fix the card first, then the code.

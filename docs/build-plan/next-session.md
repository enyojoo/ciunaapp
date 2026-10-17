# Next session: continue the customer app backend and the blocked cards

Written 2026-10-18 at the end of a long session, updated after the support API landed. Read this first, then `customer-app-status.md` (done and left lists) and `design-system/guides/80-decisions.md` (owner decisions). Everything below is committed on `main`; nothing is pushed.

## State right now

- **Customer Expo app (`mobile/`, native and web):** everything that needs no backend is built and committed. Home fits every screen with no scrolling; one shared top bar; checkout has Details and Review steps; desktop web layouts checked at 1280x800. tsc, locales:check, design:check, design:cards all pass.
- **Store hours, minimum order, delivery time, expert fields:** built end to end (migration, API, seller portal, app). The owner has run `storefront-details.sql` and the files before it.
- **Support requests: done** (see item 1). Run `support-requests.sql` to turn it on.
- Not started: receipts, limits, push registration.

## Order of work

### 1. Support requests: DONE
Built end to end: database, customer API, Office API, the three app screens (`mobile/app/support/*`), the Office page (`office/app/support/page.tsx`, in the nav as Support requests), `verify-all.sql` rows, the CustomerSupport card, strings in six languages. **Owner action: run `supabase/deploy/support-requests.sql`** (after the earlier files), then run `verify-all.sql` and check no row shows false. Not built, by decision: screenshot attachments and the AI assistant. Optional follow-ups: an email or push to the customer when staff reply (comes with push, item 4), and a Support unread badge on the More tab.

### 2. Receipts (card `ReceiptCustomer`)
Customers get a receipt for a completed Send transfer, marketplace order or booking. Plan: one API route `GET /api/receipts/[kind]/[id]` that returns a structured JSON receipt (number, date, parties, items, fees, total, payment method name only, never a provider name), and a PDF via a server-side generator (check what `api/app/api/admin/receipts` and `api/lib` already do for transfers before adding a library). Customer UI: a Receipt screen opened from the transfer detail and order view, with Share (the transfer screen already has a text Share receipt). Ask the owner before adding a PDF dependency.

### 3. Limits and KYC levels (cards `CustomerLimits`, `CustomerKyc`)
Needs an owner decision first: the monthly limit per KYC level (amounts and currency) and when usage resets. Ask via AskUserQuestion before building. Then: a `kyc_levels` settings table (or `marketplace_settings` style keys), an API `GET /api/limits` returning level, limit, used this month, resets on, and the Send quote enforcing it with a clear error; mobile screen `mobile/app/limits.tsx` linked from verification and from the Send limit error.

### 4. Push registration and in-app notifications (card `PushAndInApp`)
Needs `expo-notifications` (a new dependency; confirm with the owner) and an EAS or FCM/APNs decision. Plan: table `push_tokens (user_id, token, platform, created_at)`, `POST /api/push/register`, a sender used by support replies, order status changes and chat messages, in-app unread counts on the tabs. Web push is separate; leave it out of v1.

### 5. Left on the customer app (small)
See "Left: can be built now" in `customer-app-status.md`: Delivery or Pickup chip on Activity rows (the transactions list must return the fulfilment mode), chat side panel on desktop, store share button, and redrawing the HTML preview frames in `design-system/components/*/preview.html` for the cards changed (store header, top bar, Home tiles, checkout steps). Account deletion needs the owner's rules for what is blocked and retained.

## Owner actions pending
1. Run `supabase/deploy/support-requests.sql`, then `verify-all.sql`.
2. Decisions needed: monthly limits per KYC level; permission to add `expo-notifications`; whether to add a PDF library; whether an AI assistant is wanted.
3. Confirm tab labels (Home, Orders, Account) and the hero copy.

## How to work (practical notes)
- Checks: `npx tsc --noEmit -p mobile`, `-p api`, `-p seller`; `npm run locales:check`; `npm run design:check`; `npm run design:cards`; `cd api && npm run test:merchant` and `node --import tsx --test tests/marketplace/*.test.ts`. mobile has no working lint (no ESLint config; that was already the case).
- Screenshots: `node scripts/capture-current-app.mjs <shot names>` against the Expo web server on port 8082 (start it with the `mobile-web` preview). `CAPTURE_VIEWPORT=WxH` gives suffixed files; `CAPTURE_FAVS=1`, `CAPTURE_CLOSED=1`, `CAPTURE_OFFLINE=1`, `CAPTURE_VENDOR_VARIANT=sparse` change the mocks. Capturing `more` right after other shots sometimes redirects to login: run it alone. Wait a few seconds after an edit so the bundle rebuilds.
- Editing: for multi-line edits write a small `.mjs` script in the session scratchpad and run it with node; shell quoting breaks on nested template strings. Use `git add` on named paths and commit per piece with the Co-Authored-By line the session gives.
- Schema rules: additive only, `begin; set local lock_timeout = '5s'; ... commit;`, service-role only with RLS on, a deploy copy in `supabase/deploy/` plus a `RUN-ORDER.md` row, and a database test under `api/tests/merchant/`.
- Customer strings go in all six languages (en, ru, fr, es, zh, pt); seller strings in `seller/locales/<lng>/*.json`.

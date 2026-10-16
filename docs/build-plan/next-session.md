# Next session: continue the customer app backend and the blocked cards

Written 2026-10-18 at the end of a long session. Read this first, then `customer-app-status.md` (done and left lists) and `design-system/guides/80-decisions.md` (owner decisions). Everything below is committed on `main`; nothing is pushed.

## State right now

- **Customer Expo app (`mobile/`, native and web):** everything that needs no backend is built and committed. Home fits every screen with no scrolling; one shared top bar; checkout has Details and Review steps; desktop web layouts checked at 1280x800. tsc, locales:check, design:check, design:cards all pass.
- **Store hours, minimum order, delivery time, expert fields:** built end to end (migration, API, seller portal, app). The owner has run `storefront-details.sql` and the files before it.
- **Support requests, started:** the migration `supabase/migrations/20261018100000_support_requests.sql` is written and tested (6 database tests pass in `api/tests/merchant/database-support.test.mjs`), with the deploy copy `supabase/deploy/support-requests.sql` and a row in `RUN-ORDER.md`. **The owner has NOT run it, and no API or UI exists yet.** Do not tell the owner to run it until the API is in.
- Not started: receipts, limits, push registration.

## Order of work

### 1. Support requests (finish)
Schema is done: tables `support_requests` (status open, awaiting_customer, resolved; unread counters for both sides) and `support_messages`; functions `support_create`, `support_send`, `support_resolve`, `support_mark_read`. Errors come back as exception messages: `SUPPORT_TOO_MANY_OPEN`, `SUPPORT_ORDER_NOT_FOUND`, `SUPPORT_NOT_FOUND`, `SUPPORT_CLOSED`, `SUPPORT_BAD_SENDER`. Map them like `api/lib/merchant/messages.ts` maps chat errors.

**API (new, in `api/`):**
- Customer, with `authedRoute` from `api/lib/merchant/http.ts` and `limitOrResponse` (add `support: { limit: 20, windowSeconds: 60 }` to `LIMITS` in `api/lib/rate-limit.ts`):
  - `GET /api/support/requests` (list for the user, newest message first, with `customer_unread`)
  - `POST /api/support/requests` `{ topic, subject, orderId?, body }` -> `support_create`
  - `GET /api/support/requests/[id]` (request plus messages, owner only)
  - `POST /api/support/requests/[id]/messages` `{ body }` -> `support_send(..., 'customer', ...)`
  - `POST /api/support/requests/[id]/read` -> `support_mark_read(..., 'customer')`
  - `GET /api/support/unread` (sum of `customer_unread`)
- Office, with `adminRoute` (`api/lib/merchant/http.ts`): add a `support.manage` permission to `api/lib/admin-roles.ts` (give it to `super_admin`, `ops`, `support`; keep `support.read` for reads), then:
  - `GET /api/admin/support` (queue: filter status, assigned, text; show customer name, topic, status, unread, age)
  - `GET /api/admin/support/[id]`, `POST /api/admin/support/[id]/messages` (agent reply), `PATCH /api/admin/support/[id]` (assign, resolve via `support_resolve`), each audited with `api/lib/merchant/audit.ts`.
  - Check `api/tests/merchant/admin-legacy-permissions.test.ts` and `rules.test.ts` after adding the permission.
- Tests: add `api/tests/merchant/support.test.ts` for validation and error mapping; keep the database tests green. Run `cd api && npm run test:merchant`.

**Customer screens (`mobile/`):** keep `support.tsx` (contact rows, FAQ, hours) and add a "My requests" row. New routes `mobile/app/support/requests.tsx` (list with filter chips All, Open, Resolved; status words per the card: Awaiting you and In review are warning, Resolved is success), `support/new.tsx` (topic chips, related order picker, subject, message with counter, Send request; no screenshot upload in v1), `support/[id].tsx` (thread: customer bubbles primary with white text, agent bubbles neutral, system line for "resolved", composer with counter, mark read on open). Register the three in `mobile/app/_layout.tsx` Stack.Screen entries with titles (the shared stack header draws the bar). Reuse `chat.tsx` patterns (polling, retry, rate-limit notice) and `AppTextInput`, `LoadError`, `EmptyState`. Strings in all six languages in `packages/shared/src/locales/*/app.json` (run `npm run locales:check`). Show an unread dot on the Support row in More and on the list rows.

**Office page:** `office/app/support/page.tsx` modelled on `office/app/reviews/page.tsx`: queue on the left, thread and reply box on the right, assign to me, Resolve. Add it to the Office nav.

**Do not build the AI assistant** (`mobile/app/assistant.tsx` stays as is): it needs an LLM and the card says it must never invent amounts. Ask the owner first.

**Then:** add support tables and functions to `supabase/deploy/verify-all.sql` (the test `api/tests/merchant/database-verify.test.mjs` applies every migration and expects no false rows, so it will catch drift), update `design-system/components/CustomerSupport/README.md` Upgrade section, `customer-app-status.md`, and tell the owner to run `support-requests.sql`.

### 2. Receipts (card `ReceiptCustomer`)
Customers get a receipt for a completed Send transfer, marketplace order or booking. Plan: one API route `GET /api/receipts/[kind]/[id]` that returns a structured JSON receipt (number, date, parties, items, fees, total, payment method name only, never a provider name), and a PDF via a server-side generator (check what `api/app/api/admin/receipts` and `api/lib` already do for transfers before adding a library). Customer UI: a Receipt screen opened from the transfer detail and order view, with Share (the transfer screen already has a text Share receipt). Ask the owner before adding a PDF dependency.

### 3. Limits and KYC levels (cards `CustomerLimits`, `CustomerKyc`)
Needs an owner decision first: the monthly limit per KYC level (amounts and currency) and when usage resets. Ask via AskUserQuestion before building. Then: a `kyc_levels` settings table (or `marketplace_settings` style keys), an API `GET /api/limits` returning level, limit, used this month, resets on, and the Send quote enforcing it with a clear error; mobile screen `mobile/app/limits.tsx` linked from verification and from the Send limit error.

### 4. Push registration and in-app notifications (card `PushAndInApp`)
Needs `expo-notifications` (a new dependency; confirm with the owner) and an EAS or FCM/APNs decision. Plan: table `push_tokens (user_id, token, platform, created_at)`, `POST /api/push/register`, a sender used by support replies, order status changes and chat messages, in-app unread counts on the tabs. Web push is separate; leave it out of v1.

### 5. Left on the customer app (small)
See "Left: can be built now" in `customer-app-status.md`: Delivery or Pickup chip on Activity rows (the transactions list must return the fulfilment mode), chat side panel on desktop, store share button, and redrawing the HTML preview frames in `design-system/components/*/preview.html` for the cards changed (store header, top bar, Home tiles, checkout steps). Account deletion needs the owner's rules for what is blocked and retained.

## Owner actions pending
1. Run `supabase/deploy/support-requests.sql` once item 1 is finished (not before).
2. Decisions needed: monthly limits per KYC level; permission to add `expo-notifications`; whether to add a PDF library; whether an AI assistant is wanted.
3. Confirm tab labels (Home, Orders, Account) and the hero copy.

## How to work (practical notes)
- Checks: `npx tsc --noEmit -p mobile`, `-p api`, `-p seller`; `npm run locales:check`; `npm run design:check`; `npm run design:cards`; `cd api && npm run test:merchant` and `node --import tsx --test tests/marketplace/*.test.ts`. mobile has no working lint (no ESLint config; that was already the case).
- Screenshots: `node scripts/capture-current-app.mjs <shot names>` against the Expo web server on port 8082 (start it with the `mobile-web` preview). `CAPTURE_VIEWPORT=WxH` gives suffixed files; `CAPTURE_FAVS=1`, `CAPTURE_CLOSED=1`, `CAPTURE_OFFLINE=1`, `CAPTURE_VENDOR_VARIANT=sparse` change the mocks. Capturing `more` right after other shots sometimes redirects to login: run it alone. Wait a few seconds after an edit so the bundle rebuilds.
- Editing: for multi-line edits write a small `.mjs` script in the session scratchpad and run it with node; shell quoting breaks on nested template strings. Use `git add` on named paths and commit per piece with the Co-Authored-By line the session gives.
- Schema rules: additive only, `begin; set local lock_timeout = '5s'; ... commit;`, service-role only with RLS on, a deploy copy in `supabase/deploy/` plus a `RUN-ORDER.md` row, and a database test under `api/tests/merchant/`.
- Customer strings go in all six languages (en, ru, fr, es, zh, pt); seller strings in `seller/locales/<lng>/*.json`.

# Next session: continue the customer app backend and the blocked cards

Written 2026-10-18 at the end of a long session, updated after the support API landed. Read this first, then `customer-app-status.md` (done and left lists) and `design-system/guides/80-decisions.md` (owner decisions). Everything below is committed on `main`; nothing is pushed.

> **Phases 1 to 3 of `customer-completion-plan.md` are built (2026-10-19). Read its Status section; only phase 4 (ship) remains.** Where it differs from the list below, it wins.

## State right now

- **Customer Expo app (`mobile/`, native and web):** everything that needs no backend is built and committed. Home fits every screen with no scrolling; one shared top bar; checkout has Details and Review steps; desktop web layouts checked at 1280x800. tsc, locales:check, design:check, design:cards all pass.
- **Store hours, minimum order, delivery time, expert fields:** built end to end (migration, API, seller portal, app). The owner has run `storefront-details.sql` and the files before it.
- **Support requests: done** (see item 1). Run `support-requests.sql` to turn it on.
- Receipts and limits: done. Push registration: server and registration done (item 4); in-app unread counts left.

## Order of work

### 1. Support requests: DONE
Built end to end: database, customer API, Office API, the three app screens (`mobile/app/support/*`), the Office page (`office/app/support/page.tsx`, in the nav as Support requests), `verify-all.sql` rows, the CustomerSupport card, strings in six languages. **Owner action: run `supabase/deploy/support-requests.sql`** (after the earlier files), then run `verify-all.sql` and check no row shows false. Not built, by decision: screenshot attachments and the AI assistant. Optional follow-ups: an email or push to the customer when staff reply (comes with push, item 4), and a Support unread badge on the More tab.

### 2. Receipts: DONE (without a PDF)
`api/lib/receipts.ts`, route `api/app/api/receipts/[kind]/[id]` (kinds transfer, order, booking), screen `mobile/app/receipt/[kind]/[id].tsx`, View receipt links on the transfer and order screens, six languages, tests. Text Share works. **Still open: PDF download and the shared image** (needs a library decision: ask the owner).

### 3. Limits: DONE except an Office editor
Table and usage function in `send-limits.sql` (not yet run: owner action), logic `api/lib/limits.ts`, `GET /api/limits`, admin `GET` and `PUT /api/admin/send-limits` (needs `settings.manage`), enforcement in `send/quotes` and `send/transfers`, screen `mobile/app/limits.tsx`, More row, Send messages. **No amounts exist until compliance sets them**; example: `PUT /api/admin/send-limits` with `{ "level": 1, "currency": "RUB", "monthlyAmount": 50000, "minPerTransfer": 1000, "maxPerTransfer": 50000 }`. Still to do: an Office settings screen to edit them. Open question for the owner: limits are compared only for transfers sent in the limit's own currency (multi-currency conversion is not done).

### 4. Push registration: DONE (except in-app unread counts)
Server: `push_tokens` table (`push-tokens.sql`, RUN-ORDER #8, owner action to run), `api/lib/push.ts` sender, `POST/DELETE /api/push/register`, `notifySupportReply` when Office replies, six languages, tests. App: `expo-notifications` and `expo-device` added (owner approved); `mobile/lib/push-registration.ts` asks permission and registers the Expo token after sign-in (physical phones only; web skipped), unregisters on sign-out, and a tapped support notification opens that request (`components/push-registration.tsx`, mounted in `_layout.tsx`). `app.config.js` now sets NODE_PATH so config plugins of root-hoisted packages find `expo`. **Needs a new native build (EAS) to take effect; Expo Go cannot receive remote push.** Still to do: unread counts on the tabs, order status and chat message notifications (reuse `sendPushToUser`). Set `EXPO_ACCESS_TOKEN` on the API only if enhanced push security is on in Expo.

### 5. Left on the customer app (small)
See "Left: can be built now" in `customer-app-status.md`: Delivery or Pickup chip on Activity rows (the transactions list must return the fulfilment mode), chat side panel on desktop, store share button, and redrawing the HTML preview frames in `design-system/components/*/preview.html` for the cards changed (store header, top bar, Home tiles, checkout steps). Account deletion needs the owner's rules for what is blocked and retained.

## Owner actions pending
1. Run `supabase/deploy/support-requests.sql`, `send-limits.sql` and `push-tokens.sql`, then `verify-all.sql` (no row may show false).
2. Decisions needed: the monthly limit per level and how to treat other currencies (set via the admin API); whether to add a PDF library; whether an AI assistant is wanted.
3. Confirm tab labels (Home, Orders, Account) and the hero copy.

## How to work (practical notes)
- Checks: `npx tsc --noEmit -p mobile`, `-p api`, `-p seller`; `npm run locales:check`; `npm run design:check`; `npm run design:cards`; `cd api && npm run test:merchant` and `node --import tsx --test tests/marketplace/*.test.ts`. mobile has no working lint (no ESLint config; that was already the case).
- Screenshots: `node scripts/capture-current-app.mjs <shot names>` against the Expo web server on port 8082 (start it with the `mobile-web` preview). `CAPTURE_VIEWPORT=WxH` gives suffixed files; `CAPTURE_FAVS=1`, `CAPTURE_CLOSED=1`, `CAPTURE_OFFLINE=1`, `CAPTURE_VENDOR_VARIANT=sparse` change the mocks. Capturing `more` right after other shots sometimes redirects to login: run it alone. Wait a few seconds after an edit so the bundle rebuilds.
- Editing: for multi-line edits write a small `.mjs` script in the session scratchpad and run it with node; shell quoting breaks on nested template strings. Use `git add` on named paths and commit per piece with the Co-Authored-By line the session gives.
- Schema rules: additive only, `begin; set local lock_timeout = '5s'; ... commit;`, service-role only with RLS on, a deploy copy in `supabase/deploy/` plus a `RUN-ORDER.md` row, and a database test under `api/tests/merchant/`.
- Customer strings go in all six languages (en, ru, fr, es, zh, pt); seller strings in `seller/locales/<lng>/*.json`.

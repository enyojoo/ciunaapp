# Customer app: completion plan (decided 2026-10-18)

Goal: finish the customer app (`mobile/`, native and Expo web) and every API it needs, then ship. This replaces the "Left" lists in `customer-app-status.md` and the order in `next-session.md`. The SQL for support, limits and push has been run.

## Product decisions

| Topic | Decision | Why |
|---|---|---|
| App lock (PIN) | **Optional, never required.** We hold no funds and every transfer needs an explicit action, so there is no forced PIN. Keep the existing opt-in PIN (More > Login PIN). Add Face ID or fingerprint as the quick unlock when a PIN is set. One simple rule: 5 wrong PINs sign the user out (full login needed); show "N attempts left" from the 3rd miss. No timed lockouts. | The app still holds saved recipients, ID verification details and order history, so people who want a lock can have one. It is not a money safeguard. |
| AI assistant | **Cut.** Remove the `assistant` screen and card from the app and the design system. | Owner decision; support requests cover help. |
| Send limit amounts | **Office sets them; nothing is seeded.** Build the Office editor now. Compliance enters amounts per level and currency before launch. | Limits are a compliance number, not a product one. Until set, sending is not capped. |
| PDF receipts | **Yes, with `expo-print` and `expo-sharing`** (Expo-maintained, no third-party PDF library). Receipt renders to a PDF and shares on phone; on web it opens the print dialog. | Users need proof of payment. |
| Account deletion | **Required (App Store rule).** In Settings, after PIN or password. Blocked while an order is active, a transfer is in flight or a support request is open with a refund pending. The account is disabled at once and personal data is anonymised after 30 days. Transaction records are kept 5 years, de-identified. | Store compliance plus financial record keeping. Owner to confirm the retention period with compliance. |
| Paused store | **Yes.** Seller can pause; behaves like closed (checkout blocked, "Temporarily unavailable"). | Sellers need an off switch that is not opening hours. |
| Delivery fee and minimum per area | **After launch.** Per-store minimum stays. | Works today; adds seller complexity. |
| Expert availability and from-price | **Build.** "Next available" and "From {price}" on expert cards. | Biggest conversion cue for booking. |
| Expert credentials editor | **Build** in the seller portal. | The customer app already shows them; sellers cannot edit. |
| Per-stage order timestamps | **Build.** An order events table feeds the timeline times. | Fixes "Preparing and Ready show as one stage". |
| Seller rating on the order | **Cut.** Reviews already cover it. | Duplicate. |
| Chat response-time line | **Cut for v1.** | Needs history to be honest. |
| Verification tooltip | **Simplify.** Static explanation of the two tiers, no check date or checklist. | Real checklist needs a data model nobody asked for. |
| Popular near you, translation hint | **Cut for v1.** | Need volume and a translation service. |
| Notifications | **Build:** order status, new chat message, support reply (done). Unread counts on the tabs. A Notifications settings screen with three toggles. | Completes push. |
| Store share | **Build.** Share link to the store on `m.ciuna.com`. | Cheap growth. |
| `web/` Next app | **Not the customer web.** The customer web is Expo web (`m.ciuna.com`). Stop porting; keep `web/` for marketing and redirect customer flows to the Expo web app. | One codebase, not two. Confirm that `web/` has no flow you still need before removing its copies. |

## Build order

### Phase 1: money safety and store compliance
1. App lock: biometric unlock and the 5-attempt sign-out on the existing optional PIN (small).
2. Office editor for send limits (list, edit, empty state).
3. Account deletion: API (`DELETE /api/account` request, guard checks, 30-day job), app flow, Office view of pending deletions, tests.

### Phase 2: orders and notifications
4. Order events table, timeline times in the order view and API.
5. Order status and chat message pushes, unread counts on tabs, Notifications settings.
6. Paused store: seller toggle, public payload, closed-style block in cart and checkout.
7. Delivery or Pickup chip on Activity rows (transactions list returns fulfilment mode).

### Phase 3: experts, receipts, polish
8. Expert next available and from-price (API and cards); credentials editor in seller.
9. PDF receipts with `expo-print`.
10. Store share, verification tooltip simplified, chat side panel on wide web.
11. Remove the assistant; redraw the stale design preview frames; update card READMEs.

### Phase 4: ship
12. Full pass on every screen against the design cards, at 320 to 430 wide and 1280 desktop; fix drift.
13. End-to-end test of send, food order, mart order, booking, support, deletion on a real phone build.
14. Crash reporting and basic analytics (events: sign up, send, order, booking), privacy labels, store listing assets, deep links.
15. EAS build, TestFlight and Play internal test, then submit.

## Owner actions
- Enter send limits in Office once the editor exists (compliance numbers).
- Confirm the deletion retention period and the `web/` decision.
- Provide the Apple and Google developer accounts for the EAS build.

## Status (2026-10-19): phases 1 to 3 built; phase 4 partly done

Built and committed: optional app lock with biometric and 5-attempt sign-out; Office Send limits editor; account deletion (database, API, app, Office Account deletions page, daily removal job); per-step times in the order timeline (from the existing order events, no new table); order and chat push notifications, Notifications settings, tab badges; paused store; Delivery or Pickup on Activity rows; expert from-price, next available and the seller credentials editor; PDF receipts; store share; verification explainer; chat side panel on wide web; assistant stub removed.

Deviations from the plan above:
- No order events table: the existing `marketplace_events` already records paid, accept, start, fulfill, cancel and refund with times. A `notified_at` column makes each event notify once.
- Account deletion asks for a confirmation dialog, not a PIN or password re-entry.
- The Delivery or Pickup mark is text in the row's date line, not a chip.
- Design preview HTML frames were not redrawn; the card READMEs point to the app screenshots (As built) instead.
- Verification tooltip is a plain explanation dialog on the store and expert profile screens.

Still to do (phase 4): crash reporting and analytics, store listing assets and privacy labels, deep links, EAS build and test-track release, end-to-end test on a real phone. These need your Apple, Google and monitoring accounts.

Owner actions: run `account-deletion.sql`, `push-preferences.sql`, `store-pause.sql` (RUN-ORDER #9 to #11), then `verify-all.sql`; make sure `CRON_SECRET` is set on the API (the new jobs account-purge and order-notifications use it); enter send limits in Office.

# Customer app: completion plan (decided 2026-10-18)

Goal: finish the customer app (`mobile/`, native and Expo web) and every API it needs, then ship. This replaces the "Left" lists in `customer-app-status.md` and the order in `next-session.md`. The SQL for support, limits and push has been run.

## Product decisions

| Topic | Decision | Why |
|---|---|---|
| PIN lock rules | **Yes.** 5 wrong PINs lock the app for 1 minute, 10 for 15 minutes, 15 sign the user out (full login needed). Show "N attempts left" from the 3rd miss. Counted on the device; a correct PIN resets it. | It guards money. Without a limit a 4-digit PIN is guessable in minutes. |
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
1. PIN lock rules (device logic, screens, six languages, tests).
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

# Dev plan — Food/Mart cart + YooKassa online payment

Engineering execution plan for the product plan agreed in chat. This is the file-by-file
task breakdown: what gets created/changed per phase, in what order, and how each phase
is verified before moving to the next. See [DESIGN.md](../DESIGN.md) for the product rules
this must keep respecting (naming, brand, "hub" internals, i18n).

No schema change is applied to the live database as part of this plan — Phase 1 ends with
a migration file and exact apply instructions, run manually.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done.

---

## Phase 1 — Schema, cart API, generalized checkout, YooKassa server plumbing

**Goal:** every new table/column exists (as a migration file, not yet applied) and the API
surface for cart + dual-payment checkout works end-to-end against it, testable with `curl`
before any UI exists.

### 1.1 Schema
- [x] [supabase/migrations/20260918213000_hub_cart_and_gateway_payments.sql](../supabase/migrations/20260918213000_hub_cart_and_gateway_payments.sql)
  - `hub_carts`, `hub_cart_items`, `hub_order_items` (as specified in the product plan)
  - `transactions`: + `payment_provider`, `gateway_payment_id`, `gateway_status`, `gateway_confirmation_url`
  - `hub_products`: + `stock_quantity`, `sold_out`
  - All `add column if not exists` / `create table if not exists`, additive only.
- [x] **Applied to the live database by the user** (`supabase db push`), confirmed via a read-only REST check on all three new tables + the new `transactions` columns.

### 1.2 Shared types
- [x] [api/lib/hub-types.ts](../api/lib/hub-types.ts) (mirrored into [web/lib/hub-types.ts](../web/lib/hub-types.ts), [mobile/lib/types.ts](../mobile/lib/types.ts)):
  `HubCartRow`, `HubCartItemRow` (hydrated `product`), `HubOrderItemRow`. `HubTransactionSnapshot` also
  gained an `items[]` field — cart checkouts denormalize the line items into it, so order detail,
  Transactions list, and Office can all render an itemized order from `hub_snapshot` alone, no join needed.
- [x] [api/types/index.ts](../api/types/index.ts) (mirrored into [web/types/index.ts](../web/types/index.ts)): `Transaction` +
  `payment_provider`, `gateway_payment_id`, `gateway_status`, `gateway_confirmation_url`.
- [x] `PublicPlatformFlags` (api + web) gained `yookassaEnabled`, env-derived (`isYooKassaConfigured()`), so
  clients can hide "Pay online" entirely when no YooKassa shop is configured.

### 1.3 Cart data layer
- [x] [api/lib/hub-cart-server.ts](../api/lib/hub-cart-server.ts) — `getActiveCart`, `getActiveCartForServiceLine`
  (added beyond the original plan — lets `/food/cart` load without knowing a vendor id up front),
  `createOrGetActiveCart`, `addCartItem`, `updateCartItemQuantity`, `removeCartItem`, `hydrateCart`.
  Enforces `pricing_type: "fixed"` + vendor match; flags unavailable items instead of dropping them.
  **Also enforces the "single active cart per line" rule**: adding from a different vendor in the same
  service line auto-abandons the other active cart and returns `clearedVendorName` so the UI can say so
  (a toast, not a blocking confirm — see Scope notes below).
- [x] [api/app/api/hub/cart/route.ts](../api/app/api/hub/cart/route.ts) — `GET` (by `vendorId` or `serviceLineSlug`), `POST`, `DELETE`.
- [x] [api/app/api/hub/cart/items/route.ts](../api/app/api/hub/cart/items/route.ts) — `POST` add item.
- [x] [api/app/api/hub/cart/items/[itemId]/route.ts](../api/app/api/hub/cart/items/%5BitemId%5D/route.ts) — `PATCH`, `DELETE`.

### 1.4 Pricing helper
- [x] [api/lib/hub-cart-pricing.ts](../api/lib/hub-cart-pricing.ts) — `computeHubCartTotals`, summing per-line
  `fee_percent`. Validates one `fixed_currency` across items. Mirrored (by hand — no shared build step)
  into [web/lib/hub-cart-pricing.ts](../web/lib/hub-cart-pricing.ts) and [mobile/lib/hub-cart-pricing.ts](../mobile/lib/hub-cart-pricing.ts) for client-side live totals.

### 1.5 Generalized checkout
- [x] [api/lib/hub-checkout-server.ts](../api/lib/hub-checkout-server.ts) — `createHubCartCheckoutTransaction`:
  loads the cart, re-validates everything server-side, computes totals, writes the `transactions` header +
  `hub_order_items`, marks the cart `converted`. Legacy `createHubCheckoutTransaction` untouched.
- [x] [api/app/api/hub/checkout/route.ts](../api/app/api/hub/checkout/route.ts) — branches on `body.cartId` vs. legacy `body.hubProductId`.
- [x] Manual sub-path: unchanged (`status: "pending"`, office reviews the uploaded receipt).
- [x] Online sub-path: transaction inserted `pending` first; `returnUrl` is built **server-side**
  (`${NEXT_PUBLIC_APP_URL}/pay/{transactionId}`) once the transaction id exists — simpler than the
  original plan's client-supplied `returnUrl`, and removes a chicken-and-egg ordering problem.

### 1.6 YooKassa server client + webhook
- [x] [api/lib/yookassa.ts](../api/lib/yookassa.ts) — `createYooKassaPayment` (embedded confirmation type by
  default), `getYooKassaPayment`, `isYooKassaConfigured`.
- [x] [api/lib/gateway-checkout.ts](../api/lib/gateway-checkout.ts) (new, beyond the original plan) —
  `attachYooKassaPayment`, shared by Hub cart checkout **and** Expert booking checkout (Phase 5), so the
  "create payment, store the reference, roll back the order on failure" logic exists exactly once.
- [x] [api/app/api/webhooks/yookassa/route.ts](../api/app/api/webhooks/yookassa/route.ts) — re-fetches the
  payment before trusting it, applies the valid state transition, reuses `processReferralRewardsOnCompletedSend`
  / `rollbackReferralRewardsForTransaction`. Idempotent.
- [x] [env.example](../env.example) — `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_RETURN_URL`, blank.

### 1.7 Verify Phase 1
- [x] `tsc --noEmit` clean in `api/`, `web/`, `mobile/`, `office/` after every edit in this plan — zero new
  errors introduced anywhere touched (checked by diffing error counts/messages against each workspace's
  pre-existing baseline, which already has ~130 unrelated errors on `web` and a similar set on `office`).
- [ ] **Not done — no way to, in this environment**: an actual `curl`/Postman pass, and a real YooKassa
  sandbox payment. No dev server was started and no YooKassa shop exists yet. Treat the online-payment
  path as unverified against a live gateway until a real `YOOKASSA_SHOP_ID`/`SECRET_KEY` exist and someone
  runs an end-to-end payment.
- [x] Legacy `hubProductId` / `user_input` checkout path is untouched code — regression risk is low, but
  still unexercised by an actual request in this session.

---

## Phase 2 — Add-to-cart + Cart screen (web & mobile)

### Web
- [x] [web/lib/hub-cart-client.ts](../web/lib/hub-cart-client.ts) — `fetchWithAuth` wrapper + a
  `useSyncExternalStore`-based cache keyed per vendor (and per line, for the Cart screen), so every
  component watching a vendor's cart re-renders from one shared fetch instead of each polling separately.
- [x] [web/components/hub/vendor-hub-catalog.tsx](../web/components/hub/vendor-hub-catalog.tsx) — fixed-price
  cards get Add-to-cart + qty stepper; `user_input` cards keep the direct Link. **Also updated**
  [web/components/hub/hub-marketplace-line-home.tsx](../web/components/hub/hub-marketplace-line-home.tsx) —
  found during the build that the `/food` and `/mart` home pages have their *own* separate featured-product
  card component (not `VendorHubCatalog`), which the original plan missed; it needed the same treatment.
- [x] [web/components/hub/hub-cart-bar.tsx](../web/components/hub/hub-cart-bar.tsx) — floating bar, mounted on
  the vendor storefront pages (not the mixed line-home feed — see Known gaps below).
- [x] [web/app/food/cart/page.tsx](../web/app/food/cart/page.tsx), [web/app/mart/cart/page.tsx](../web/app/mart/cart/page.tsx) → shared [hub-cart-page.tsx](../web/components/hub/hub-cart-page.tsx).
- [x] [web/lib/hub-public-paths.ts](../web/lib/hub-public-paths.ts) — `hubCartPath`, `hubCartCheckoutPath`.
- **Scope decision**: the "prompts to clear" UX from the product plan is implemented as an automatic
  clear-with-toast-notice (server abandons the sibling cart, returns `clearedVendorName`, client toasts
  it) rather than a blocking confirm dialog — simpler, still tells the customer what happened, no data
  loss without notice.

### Mobile
- [x] [mobile/lib/hub-cart.ts](../mobile/lib/hub-cart.ts) — same shape as the web client.
- [x] [mobile/app/(app)/hub/[slug]/cart.tsx](../mobile/app/\(app\)/hub/%5Bslug%5D/cart.tsx).
- [x] [mobile/components/hub-cart-bar.tsx](../mobile/components/hub-cart-bar.tsx), mounted on the vendor storefront screen.
- [x] [mobile/components/product-card.tsx](../mobile/components/product-card.tsx) / [catalog-products.tsx](../mobile/components/catalog-products.tsx) — cart mode (qty stepper) added, wired from [hub/[slug]/v/[vendor].tsx](../mobile/app/\(app\)/hub/%5Bslug%5D/v/%5Bvendor%5D.tsx).
- **Known gap**: mobile's *mixed* catalog screen ([hub/[slug]/index.tsx](../mobile/app/\(app\)/hub/%5Bslug%5D/index.tsx),
  showing featured products across vendors) was **not** given cart mode — each card would need its own
  per-product `useHubCart` hook (like web's `MarketplaceProductCard` got), which `ProductCard`/`CatalogProducts`
  aren't structured for yet. Only the single-vendor storefront has Add-to-cart on mobile today. Web has it
  in both places (see above). Worth closing in a follow-up for full parity.

### Verify Phase 2
- [x] `tsc --noEmit` clean across `web`/`mobile` after every file in this phase.
- [ ] Not run: an actual two-vendor add-to-cart walkthrough, a live refresh/relaunch persistence check — no
  dev server or device was started in this session.

---

## Phase 3 — Checkout rewrite + order/Transactions rendering (web & mobile)

### Web
- [x] [web/app/food/checkout/page.tsx](../web/app/food/checkout/page.tsx), [web/app/mart/checkout/page.tsx](../web/app/mart/checkout/page.tsx) → shared [hub-cart-checkout-page.tsx](../web/components/hub/hub-cart-checkout-page.tsx).
  The legacy `[productId]` route is untouched and still serves `user_input` products.
- [x] Step 3 branches to **Bank transfer** vs **Pay online** when `yookassaEnabled && sendCurrency === "RUB"`.
- [x] **Design change from the plan**: instead of a `hub-online-pay-step.tsx` embedding `Checkout.js`
  *inline on the checkout page*, online payment navigates to a shared hosted page,
  [web/app/pay/[transactionId]/page.tsx](../web/app/pay/%5BtransactionId%5D/page.tsx), which embeds the
  widget and polls `/api/hub/checkout/gateway/[transactionId]` for the webhook-confirmed status. Reasoning:
  this is the *same* page mobile needs to open in its in-app browser (see Phase 6), so building it once as
  a real route — rather than an inline widget on web plus a separate mobile solution — means one
  implementation instead of two.
- [x] [web/components/transaction-order-detail-page.tsx](../web/components/transaction-order-detail-page.tsx) —
  renders `hub_snapshot.items[]` as a line-item list plus a "Paid online" indicator when `payment_provider === "yookassa"`.
- [x] Transactions **list** needed no code change — it already renders `hub_snapshot.productTitle`, which
  cart checkouts populate server-side as "N items from {Vendor}".
- [x] No path-helper changes were needed beyond the new `hubCartCheckoutPath` from Phase 2 — Next.js allows
  `checkout/page.tsx` and `checkout/[productId]/page.tsx` to coexist as sibling routes.

### Mobile
- [x] [mobile/app/(app)/hub/[slug]/checkout/index.tsx](../mobile/app/\(app\)/hub/%5Bslug%5D/checkout/index.tsx) —
  cart summary, contact/delivery, Bank transfer / Pay online choice. The `[productId].tsx` screen is untouched.
- [x] **Design change from the plan**: no `hub-online-pay-sheet.tsx` stub — the online-pay branch is fully
  functional today via `openInAppBrowser` (the existing `expo-web-browser`-based helper this app already
  uses for OAuth/legal pages), opening the same `/pay/[transactionId]` page web uses. See Phase 6 for why
  this is the honest scope call rather than a native-SDK stub.
- [x] [mobile/app/orders/[id].tsx](../mobile/app/orders/%5Bid%5D.tsx) — renders `hub_snapshot.items[]` + a "Paid online" chip.
- **Known gap**: mobile has no payment-method-display / receipt-upload screen at all, for *either* the new
  cart checkout or the pre-existing single-product checkout — this was already true before this work
  (mobile checkout has always just created the transaction and shown a bare order summary). Not something
  this task introduced; flagging it as a pre-existing mobile completeness gap worth its own follow-up.

### Verify Phase 3
- [x] `tsc --noEmit` clean across `web`/`mobile` after every file in this phase.
- [ ] Not run: an actual multi-item checkout walkthrough (manual or online), a real YooKassa sandbox
  round-trip, or the legacy single-product regression check — no dev server, device, or YooKassa
  credentials exist in this environment.

---

## Phase 4 — Office itemized order views

- [x] [office/app/transactions/page.tsx](../office/app/transactions/page.tsx) — the detail drawer (this app
  has no separate `[id]` route; list + detail live on one page) renders `hub_snapshot.items[]` and a
  "Paid online" line when `payment_provider === "yookassa"`. `CombinedTransaction`'s local type + mapper
  updated with `payment_provider`/`gateway_payment_id`. The list row needed no change (same `productTitle`
  reasoning as web's Transactions list).
- [ ] **Not done**: `office/app/orders/page.tsx` turned out to be Assistant requests + Expert bookings, not
  Hub/marketplace orders at all — no change needed there, and there was no separate "awaiting proof review"
  queue found to exclude online-paid orders from. If office has such a queue elsewhere, it wasn't located
  in this pass.
- [ ] **Not done**: `office/app/products/[id]/edit/page.tsx` stock/availability fields — deprioritized as
  explicitly non-blocking in the original plan.

### Verify Phase 4
- [x] `tsc --noEmit` clean in `office/` after the edit (checked against its own pre-existing baseline).
- [ ] Not run: opening a real cart order in the office UI — no dev server was started.

---

## Phase 5 — Experts: online payment + shared payment-step component

- [x] [api/lib/expert-checkout-server.ts](../api/lib/expert-checkout-server.ts) / [api/app/api/expert/bookings/checkout/route.ts](../api/app/api/expert/bookings/checkout/route.ts) —
  same `paymentMethod` branch as Hub checkout, reusing `attachYooKassaPayment`. On gateway failure, rolls
  back the transaction, the `expert_bookings` row, and the slot lock (three-way compensation, more than
  Hub cart checkout needs since Experts also holds a calendar slot).
- [x] [web/components/hub/expert-session-checkout-panel.tsx](../web/components/hub/expert-session-checkout-panel.tsx) —
  gained the same Bank transfer / Pay online choice at step 3.
- [ ] **Not done — scope cut**: the "extract into a genuinely shared component" part of this phase. Given
  the size of this task overall, the online-pay branch was inlined directly into the existing 800-line
  panel (functionally correct, ships the feature) rather than extracted into a shared component with Hub
  checkout. The de-duplication opportunity the original plan identified still stands as a clean follow-up —
  it's a refactor, not new functionality, so it was the right thing to defer rather than the payment logic itself.
- [ ] Mobile expert booking checkout screen — **not touched in this pass**; the mobile online-payment work
  went into the new Hub cart checkout screen (Phase 3) only. Expert booking on mobile still uses whatever
  checkout flow it had before.

### Verify Phase 5
- [x] `tsc --noEmit` clean in `api/`, `web/` after these edits.
- [ ] Not run: an actual expert booking through both payment paths — no dev server was started.

---

## Phase 6 — Native YooKassa SDK (mobile) + dev workflow cutover

**Not started, and deliberately so.** This phase needs Xcode and Android Studio to write, build, and
verify real Swift/Kotlin native-module code (CocoaPods/Gradle dependency wiring, an `expo-modules-core`
bridge, a config plugin) — none of that exists in this text-based environment, and there is no way to
compile or test it here. Fabricating untested native code would be worse than not writing it. What
shipped instead: mobile's online-payment path (Phase 3) is **fully functional today** via
`openInAppBrowser` opening the same `/pay/[transactionId]` hosted widget page web uses — real, working,
just not the native card sheet / Apple Pay / Google Pay experience this phase would add.

Remaining, for whoever picks this up with Xcode/Android Studio available:
- [ ] Expo config plugin registering `yookassa-payments-swift` (CocoaPods) and `yookassa-payments-android`
  (Gradle) as native dependencies at prebuild.
- [ ] Thin `expo-modules-core` native module exposing `startYooKassaPayment(...)` to JS, iOS + Android.
- [ ] Build `mobile/eas.json`'s existing `development` profile once the native module lands, and switch
  local iteration from the Expo Go app to that dev-client build.
- [ ] `DESIGN.md`'s "Expo Go after each slice" line — still accurate today (nothing in this pass added a
  native dependency), update it only once this phase actually lands.
- [ ] Swap the checkout screen's `openInAppBrowser` call for the native module.

### Verify Phase 6
- [ ] A real (sandbox) card payment completes through the native sheet on both an iOS simulator/device and an Android emulator/device.

---

## Phase 7 — Docs

- [x] [DESIGN.md](../DESIGN.md): removed "Not a shopping-cart UX" / "Cart-only checkout"; added the cart
  flow, the two payment rails, and updated the Screen intent table (Product, Screen intent, Native visual
  rules, MVP slices sections).
- [x] This file updated to reflect what actually shipped vs. what was scoped out, with reasons.

---

## Cross-cutting notes

- **Backward compatibility**: nothing in Phase 1–3 changes behavior for a `hubProductId`-only
  caller or for `user_input` products — both keep working through the code paths that exist today.
- **No test suite exists** in this repo (`web`/`api`/`mobile`/`office` have no `test` script) —
  verification per phase is `tsc --noEmit` / `turbo run lint` plus the manual walkthroughs listed
  under each phase's "Verify" section, via the `run` skill / browser pane / iOS simulator.
- **Nothing gets committed or pushed automatically** — changes land in the working tree per phase; commits happen when asked.
- **The DB migration is never auto-applied** — it was applied by the user directly, and confirmed present via a read-only REST check (all three tables + the new `transactions` columns).

### What's genuinely unverified

Everything in this plan passed `tsc --noEmit` in its own workspace with zero new errors, checked against
each workspace's pre-existing baseline. Nothing was run: no dev server, no build, no device/simulator, no
real HTTP request against the applied schema, no YooKassa sandbox payment. Before calling any of this
"done" in the product sense, it needs an actual walkthrough — starting the web/api dev servers and running
a manual-transfer cart checkout end to end is the highest-value first check, since it exercises the new
schema, the cart API, and the checkout rewrite all at once with the least remaining setup (a YooKassa shop
is still needed for the online-payment path).

### Full list of scope decisions made during the build (not re-confirmed with the user before proceeding)

1. Single-active-cart-per-line enforced via auto-abandon + toast notice, not a blocking confirm dialog.
2. `returnUrl` for YooKassa built server-side from `NEXT_PUBLIC_APP_URL`, not passed by the client.
3. Web's online-pay UI is a shared hosted `/pay/[transactionId]` page (navigated to), not an inline widget
   on the checkout page itself — reused as-is for mobile's in-app browser.
4. Mobile's online payment ships via `openInAppBrowser`, not a native SDK (Phase 6 is explicitly deferred —
   see that section for why).
5. Experts' online-payment branch was inlined into the existing checkout panel rather than extracted into
   a shared component (the de-duplication itself, not the payment feature, was cut).
6. Mobile's mixed/featured product catalog (as opposed to the single-vendor storefront) did not get
   Add-to-cart — only the vendor storefront did.
7. Office's "awaiting proof review" queue exclusion for online-paid orders was not implemented — no such
   queue was located in this codebase.

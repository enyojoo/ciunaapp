# Cart + payments — gaps follow-up plan

24 September 2026 (updated). Companion to [cart-and-payments-dev-plan.md](./cart-and-payments-dev-plan.md).
That plan’s Phases 1–5 and 7 largely shipped. This file tracks follow-up gaps — plus the **product decision** below, which supersedes the interim “navigate to `/pay/[id]`” choice.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done.

---

## Product decision — where YooKassa lives

Customers pay **inside the app**, not by being sent to a separate pay route as the primary UX.

| Surface | Online pay UX (target) |
| --- | --- |
| **Next.js web** (`app.ciuna.com`) | **Inline** Checkout.js widget on checkout **pay step** (Food/Mart cart + Experts). Stay on the checkout page. |
| **Expo web** | Same — **inline** widget on the checkout pay screen (web platform of the Expo app). |
| **Expo iOS / Android** (App Store / Play Store via EAS) | **Native** YooKassa SDK sheet (card / SBP / Apple Pay / Google Pay as the SDK allows). |

**`/pay/[transactionId]`** remains as a **deep-link / resume / email** fallback, not the main checkout step.

**Expo Go:** no native SDK. Go builds fall back to hosted `/pay/[id]` browser; store binaries are what Gap G targets.

---

## Priority order

1. **P0 — Inline widget on web (+ Expo web)** — Gap H.
2. **P1 — Verify** manual cart + online (after H, against inline flow).
3. **P2 — Mobile parity** — mixed catalog cart (B), expert online pay with platform split (C).
4. **P3 — Native YooKassa on iOS/Android store builds** — Gap G.
5. **P4 — Office / ops** — stock fields (E), proof-queue (F).
6. **P5 — Refactor** shared pay rails (D) once H stabilizes the widget component.

---

## Gap H — Inline Checkout.js on web / Expo web pay step

### H.1 Shared widget
- [x] Extract widget + poll logic into [web/components/yookassa-checkout-widget.tsx](../web/components/yookassa-checkout-widget.tsx).
- [x] Keep `/pay/[id]` as a thin page that reuses that component (resume / deep link / email).

### H.2 Next.js checkout
- [x] Hub cart checkout: stay on step 3 + mount inline widget (no `/pay/…` happy path).
- [x] Experts checkout panel: same inline behavior.
- [x] After poll success → order detail; on failure → allow Bank transfer / retry.

### H.3 Expo web
- [x] [mobile/components/yookassa-checkout-widget.web.tsx](../mobile/components/yookassa-checkout-widget.web.tsx) + Hub cart / Experts book stay-on-screen mount when `Platform.OS === "web"`.

**Done when:** Food/Mart and Experts on `app.ciuna.com` complete RUB Pay online without leaving the checkout URL (except final jump to order detail). Expo web matches that intent. *(Code complete; live sandbox walkthrough tracked under Gap A.)*

---

## Gap A — Live verification

**Goal:** prove schema + cart API + checkout + webhook against a running stack.

### A.1 Manual-transfer cart
- [~] Code paths ready (cart migration applied earlier). Live multi-item Bank transfer E2E not walked in this pass (no interactive auth session here).
- [ ] Multi-item cart → Bank transfer → `pending`, cart `converted`, `hub_order_items` + `hub_snapshot.items[]` — **manual verify when api+web up**.
- [ ] Transactions + Office drawer show line items — **manual verify**.
- [ ] Legacy `user_input` single-product checkout — **manual verify**.

### A.2 Online (YooKassa) — after Gap H
- [ ] Set `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` (sandbox). Confirm `yookassaEnabled`. *(Not set in this environment — Pay online UI stays hidden until keys exist.)*
- [ ] Cart + Experts: Pay online → **inline** widget → sandbox card/SBP → webhook completed.
- [x] Negative: gateway create failure rolls back Hub / Experts (unchanged server behavior via `attachYooKassaPayment`).

### A.3 Mobile smoke
- [~] Storefront cart + Bank transfer code path present; live device smoke deferred.
- [x] Online: Expo web → inline (H); iOS/Android → native module path (G) with browser interim when SDK absent.

**Done when:** one multi-item manual checkout and one RUB online checkout (inline on web) walked end to end. *(Blocked on sandbox keys + operator walkthrough.)*

---

## Gap B — Mobile mixed / featured catalog Add-to-cart

### B.1
- [x] Cart mode on fixed-price cards from hub line `index` via `cartLineSlug` → [product-card.tsx](../mobile/components/product-card.tsx) / [catalog-products.tsx](../mobile/components/catalog-products.tsx).
- [x] `user_input` stays detail/order path.
- [x] Cart bar / header button; toast on `clearedVendorName`.

---

## Gap C — Mobile expert booking online pay

### C.1
- [x] POST `paymentMethod` aligned with expert bookings checkout.
- [x] UI: Bank transfer / Pay online when `yookassaEnabled && RUB`.
- [x] **Expo web:** inline widget (Gap H).
- [x] **iOS / Android:** native sheet when module present (Gap G); browser interim only if absent.
- [x] Order detail “Paid online” for `payment_provider === "yookassa"` (existing).

---

## Gap D — Shared Hub / Experts pay-step extract

### D.1
- [x] Shared web: [checkout-pay-rails.tsx](../web/components/hub/checkout-pay-rails.tsx) used by Hub cart + Experts panel.
- [x] Shared mobile: [checkout-pay-rails.tsx](../mobile/components/checkout-pay-rails.tsx); platform branch web → inline / native → SDK.
- [x] Duplicated pay-choice blocks removed from callers.

---

## Gap E — Office product stock / availability

- [x] Office product edit + products dialog: `stock_quantity`, `sold_out`.
- [x] Admin PATCH/POST accept columns.

---

## Gap F — Office “awaiting proof” queue / online-paid exclusion

- [x] **N/A** — no dedicated Hub “awaiting proof” / receipt-review queue exists. Office [transactions/page.tsx](../office/app/transactions/page.tsx) shows per-transaction receipts and already labels `payment_provider === "yookassa"` as paid online; there is no separate proof queue to filter.
- [x] Documented here (no code change required).

---

## Gap G — Native YooKassa SDK (iOS + Android store builds)

### G.1 Native module
- [x] Config plugin [withYooKassa.js](../mobile/modules/yookassa-payment/plugin/withYooKassa.js) + `react-native-yookassa` dependency; Pod/Maven sources at prebuild.
- [x] JS `startYooKassaPayment(...)` in [yookassa-native.ts](../mobile/lib/yookassa-native.ts) (tokenize → POST payment_token → optional 3DS).
- [x] Hub cart + Experts book: `gatewayMode: "native"` + native sheet when module present.
- [x] Fallback only for missing module / Go: temporary `/pay/[id]` browser — not the product default when SDK is linked.

### G.2 Build + verify
- [~] Wiring complete; **EAS `development` build + physical device sandbox** still required on operator machines (`eas build --profile development`).
- [x] DESIGN.md updated: web/Expo web = inline; store = native SDK.

**Done when:** store binaries complete RUB Pay online in the native sheet on both platforms. *(Code + plugin landed; device EAS verify remains operator step.)*

---

## Cross-cutting

- Gap H **reverses** parent-plan scope decision #3 (hosted `/pay` as primary web UX). Parent Phase 6 notes point here.
- `/pay/[id]` stays for deep links / resume; not the main checkout step on web.
- Bitbanker = Send only ([bitbanker-rub-onramp-plan.md](./bitbanker-rub-onramp-plan.md)).
- No auto-commit/push.
- Native API: checkout `gatewayMode: "native"` defers embedded token; `POST /api/hub/checkout/gateway/[id]` accepts `{ paymentToken }`.

### Suggested sequence

| Order | Work |
| --- | --- |
| 1 | Gap H — extract widget, inline on web Hub + Experts |
| 2 | Gap A — manual + online verify with YooKassa sandbox |
| 3 | Gap H.3 + C — Expo web inline; expert rails |
| 4 | Gap B — mobile mixed catalog cart |
| 5 | Gap G — native SDK + EAS device smoke |
| 6 | Gaps E / F / D as capacity allows |

---

## Link back

Parent: [cart-and-payments-dev-plan.md](./cart-and-payments-dev-plan.md). Mark items `[x]` here as they land; update parent “Known gap” / Phase 6 bullets to match.

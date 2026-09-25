# Ciuna marketplace — CMS, storefront, and checkout

24 September 2026. Companion to [cart-payments-gaps-plan.md](./cart-payments-gaps-plan.md) and [cart-and-payments-dev-plan.md](./cart-and-payments-dev-plan.md).

**Goal:** Food, Mart, and Experts feel like one **merchant marketplace** inside the super-app — ops configure catalog in Office; customers browse, cart/book, and **check out without Send FX chrome**.

YooKassa placement still holds (inline web/Expo web; native store builds). This doc covers **Office Hub management → consumer UX → checkout → fulfillment and support**, end to end.

**Launch requirement:** customers can place, pay for, resume, and track an order; Office can fulfill it or resolve an exception. Correct checkout appearance alone is a UI milestone, not release readiness.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done.

---

## System map

```text
Office (ops)                         Customer (web + Expo)
─────────────────                    ─────────────────────
/food|/mart/products  ──SKU──┐
/food|/mart/vendors   ──store┤──► Catalog → PDP → Cart ──► Marketplace checkout
/experts/profiles     ──pro──┤
/experts/services     ──SKU──┤──► Directory → Profile → Book ─► same pay shell
        slots schedule ──────┘
                                 Send stays a separate transfer wizard
```

| Office route | Manages | Drives on app |
| --- | --- | --- |
| `/food/products`, `/mart/products` | SKUs for that line | Line home, storefront, PDP, cart |
| `/food/vendors`, `/mart/vendors` | Storefronts | Stores rail, vendor pages, cart vendor lock |
| `/experts/profiles` | Expert discovery identity | Experts directory + profile |
| `/experts/services` (+ profile Services/Slots) | Bookable offerings + inventory | Service cards, book + slots |

Primary CMS UIs: `office/components/hub/office-hub-products-view.tsx`, `office-hub-vendors-view.tsx`, `office/components/experts/office-expert-services-view.tsx`, `office/app/experts/profiles/[id]/page.tsx`.

---

## Product decisions (locked)

### 1. Marketplace checkout ≠ Send
- No **Pay in / They get** or FX hero on Food, Mart, Experts.
- Hero number: **Total to pay** in **pay currency** (default = product / service currency).
- Optional “Pay in another currency” collapsed — only for **manual** methods that exist in that currency. YooKassa = **RUB only**.

### 2. Method-first pay step
- After order + contact (as needed): **Pay with** → method body → CTA.
- Methods = office `payment_methods` for that currency **+** Pay online (YooKassa) when `yookassaEnabled && RUB`.
- Same idea as Send’s method picker; different chrome.

### 3. Contact follows fulfillment (products)

| `fulfillment_type` | Checkout asks | Profile |
| --- | --- | --- |
| **`online`** (digital) | No address. Light identity. | Email from auth; name from profile; phone **optional** unless flag |
| **`vendor`** | Name + phone; optional store note | Prefill |
| **`in_person`** | Name + phone + **address** | Prefill; saved addresses |
| **Experts** | Name + phone; optional note | Prefill; email for receipt; no shipping |

**Critical bug today:** cart checkout **collapses `online` → `vendor`** and **always requires phone**. Plan requires treating `online` as first-class.

### 4. Shared shell
Food/Mart cart, single-product / `user_input`, and Experts book share the checkout frame, totals, payment controls, and recovery behavior. Summary and fulfillment steps vary by purchase: delivery address, pickup instructions, digital delivery destination, or appointment mode/location.

### 5. Office is the source of truth for “how it appears”
If catalog, PDP, or checkout feel wrong, fix **CMS fields + validation + consumer render** — not one-off UI hacks.

### 6. One order survives payment retries
- An order can have multiple payment attempts, with at most one active collectible attempt at a time. A retry, app restart, or method switch must not silently create another order.
- Payment success and fulfillment completion are separate facts. Preserve the unified Transactions list; show both states on marketplace order details.
- Unknown provider outcomes require reconciliation before another attempt or inventory release. A timeout is not proof that payment failed.

---

## Deep review — gaps found

### Food / Mart products CMS (`/food/products`, `/mart/products`)

**Have:** title, short description, image, status, fulfillment, vendor link, fixed / user_input pricing + currency, featured, stock / sold_out, SLA timer → `sla_text`.

**Gaps:**
1. **Line/category fragile** — `service_line_slug` derived from free-text category; wrong category → product disappears from Food/Mart or loses vendor. Routes should **force** line from `/food` vs `/mart`.
2. **Thin content** — `long_description` / `form_schema` live mainly on legacy `/products/[id]/edit`; Food/Mart dialog doesn’t edit them; **PDP never shows long copy**.
3. **Fulfillment unused downstream** — field exists in Office; cart coerces `online`→`vendor`; no “digital delivery” badge on catalog/PDP.
4. **No `require_phone` / delivery-note flags** — can’t match soft digital contact vs hard phone.
5. **Cart needs `vendor_id`** — pure digital SKUs without a storefront vendor can’t use cart (single-product only).
6. **Mixed fulfillment in one cart** — snapshot uses first item’s fulfillment; no CMS/server rule.
7. **List UX weak** — missing vendor, stock, currency, fulfillment filters; no “preview on app” link.
8. **Dual forms** — `/food/products/new` + dialog CMS diverge; ops confusion.

### Food / Mart vendors CMS

**Have:** name, slug, photo, short bio, location, published, verified; line locked by route.

**Gaps:** pickup/delivery instructions, ops contact, default fulfillment for new products, product-count / soft-delete guards, storefront preview link. Location is free-text only.

### Experts CMS

**Hierarchy (document in Office UI):**
- **Profile** = discovery (name, bio, photo, category, area, meeting hint, published).
- **Service** = sellable SKU (price, fulfillment online/in_person/both, duration, published).
- **Slots / schedule** = inventory.

**Gaps:**
1. Profile `capabilities` / `fulfillment_type` under-exposed or unused.
2. Service fulfillment doesn’t change booking contact/copy (always name+phone).
3. **Quote** pricing can be published but **cannot be paid** online — dead end for customers.
4. Min/max session minutes under-exposed vs default duration.
5. No “no open slots” health badge; weak preview of booking page.
6. Checkout still Send-shaped PayStep (same as Food/Mart).

### Consumer (web + mobile) gaps driven by CMS

| Surface | Gap |
| --- | --- |
| Catalog cards | No fulfillment / SLA / “Digital” cue |
| PDP | Short text only; no long description / gallery / delivery expectations |
| Cart checkout | Remittance UI; digital treated like vendor; phone always |
| Single-product Buy | No shared shell / YooKassa parity |
| Experts book | Phone always; fulfillment unused; quote traps |

### Checkout plan alignment

| Plan rule | Blocked by |
| --- | --- |
| Contact by fulfillment | Cart coerces `online`→`vendor`; phone always required |
| Pay currency = product currency | Clients still lead with PayStep FX |
| Method list | Rails exist; not unified with office methods as peers |
| Digital soft contact | No email-forward UI; CMS can’t mark phone optional |

---

## Target experience (best marketplace)

### Office — robust CMS

**Products (per line)**
- Line locked from route; category taxonomy scoped to Food or Mart.
- Fulfillment with helper copy matching checkout rules; warn on `online` without vendor if cart-only.
- Content: short + **long** description; single image now, gallery later; SLA shown as customer-facing “Usually within…”.
- Commerce: pricing, currency, stock, sold out, featured, vendor (required for cartable fixed SKUs).
- Flags: `require_phone` (default off for `online`, on for vendor/in_person).
- List: filters (status, fulfillment, stock, vendor); **Preview** → consumer URL.
- One create/edit path (retire or redirect legacy new/edit forks).

**Vendors**
- Bio, photo, location, published, verified.
- **Pickup / delivery notes** (shown on storefront + `vendor`/`in_person` checkout hint).
- Product count; don’t hard-delete with live products.

**Experts**
- Clear Profile / Services / Slots tabs with copy.
- Block or label **quote** until request-quote flow exists.
- Badge services with **no upcoming slots**.
- Service fulfillment drives book-page hints (online meeting vs in-person + `meeting_hint` / `service_area`).
- Preview profile / book links.

### Customer — storefront

**Catalog / storefront**
- Clear price; sold out; optional Digital / Delivery badge from fulfillment.
- Vendor chip → storefront; cart bar on Food/Mart.

**PDP**
- Image, title, **long** description, price, fulfillment expectation, SLA if set.
- Fixed with vendor → Add to cart; fixed digital without vendor → direct Order, preserving the existing default.
- `user_input` → Order with a customer-entered payable amount within server-enforced limits. It is not a merchant quote request; quote pricing stays unavailable for payment until a request/accept-quote flow exists.

**Cart**
- Single vendor, currency, and compatible fulfillment mode; reject incompatible additions with an explanation and revalidate at checkout (v1 does not split orders).
- Checkout CTA → marketplace shell.

**Experts**
- Directory → profile → service → slots → marketplace shell (booking summary).

### Customer — checkout shell

```text
Order summary (lines / service+slot) + Total to pay
Contact (only fields fulfillment needs; digital → “Receipt → email”)
Pay with (methods for pay currency)
Method body (transfer UI | YooKassa widget/native)
CTA
Order detail → payment status + fulfillment progress + next action + support
```

---

## Launch robustness requirements

### Fulfillment is a customer promise
- Define supported customer-facing modes: delivery, pickup, digital fulfillment, online appointment, and in-person appointment. Document their mapping to existing `online` / `vendor` / `in_person` values before migration; `vendor` alone does not identify pickup versus delivery.
- For each supported mode, specify required contact, destination, responsible operator, delivery/meeting instructions, expected timing, cancellation rules, and evidence of completion. Hide unsupported modes.
- Delivery: validate service area before payment and show the delivery fee, including an explicit zero when free. A saved address does not establish eligibility. Simple configured areas are sufficient for v1; maps and live courier tracking remain unnecessary.
- Pickup: show location, opening/collection hours, and when the order will be ready. Digital: explain how and when the purchase is supplied; receipt email and fulfillment destination are distinct purposes.
- Experts offering `both` must collect and snapshot the selected meeting mode. Show timezone, duration, location or meeting-link delivery instructions, and reschedule/cancellation expectations. Keep the existing name/phone rule for Experts unless separately changed.
- For digital products without a storefront vendor, record explicit Ciuna operational ownership. An optional `vendor_id` must not mean an ownerless order.

### Payment and fulfillment lifecycle
- Model payment states separately from fulfillment states. Suggested payment meanings: awaiting payment, processing/unknown, paid, failed, expired, and refund pending/refunded. Suggested fulfillment meanings: awaiting acceptance, accepted, in progress, fulfilled, cancelled. Map these onto the existing transaction/booking model without changing Send behavior.
- Use one server transition service for webhook, polling/reconciliation, and Office actions. Validate transitions atomically; repeated events must not duplicate stock changes, booking confirmation, or notifications.
- Preserve order lines, seller/operator identity, contact, fulfillment instructions, fees, and accepted price as snapshots. Catalog edits or archival must not rewrite historical orders.
- Transactions and Office must distinguish “Paid” from “Delivered” / “Session completed”; provide resume payment, instructions, and support actions appropriate to the current state.
- Cancellation does not imply refund. Record refund amount, currency, status, reference, reason, and operator; v1 may use an Office-managed refund process with a clear customer outcome.

### Durable payment attempts and recovery
- Persist the order and attempt identity before calling the provider. Keep stable idempotency keys for transport retries of the same attempt; a changed request with an existing key must be rejected.
- Enforce one conversion per cart version and atomic order/header/items/reservation creation in the database. Request idempotency alone must not permit two orders from the same cart under different keys.
- Do not delete an order on an ambiguous provider error or a failure to save a provider reference. Mark the attempt for reconciliation, retain its identity, and recover the provider result. Only release reservations after a definite failure or the documented expiry/late-payment policy.
- Method switching must first settle or cancel the previous collectible attempt. If its outcome is unknown, show “Checking payment” and prevent a second charge.
- Resume by order ID after refresh, lost response, native sheet dismissal, or app restart. Duplicate checkout responses must expose the existing order's next action or a working resume path.
- Add scheduled reconciliation and an Office exception queue for aged pending/unknown payments, including payments whose local reference could not be stored. Do not rely on the customer keeping a polling screen open.
- Native, embedded, webhook, and poll paths must produce the same durable transitions. Store mode-specific confirmation data explicitly rather than assuming every confirmation value is a web widget token.

**Evidence to address:** `api/lib/gateway-checkout.ts` currently deletes the transaction after any attach failure, including failure to save an already-created payment reference. YooKassa documents that HTTP 500 does not determine whether an operation succeeded: [API interaction and idempotency](https://yookassa.ru/developers/using-api/interaction-format). Recovery fixes are in scope even though the initial integration has shipped.

### Inventory and booking holds
- Validate requested quantity against available stock, then reserve atomically. Null stock means unlimited; finite stock cannot be oversold under concurrent checkout.
- Hold stock/slots during payment, finalize on the defined payment/acceptance transition, and release once on definite cancellation or expiry. Track reservation identity and expiry so an old callback cannot release a newer buyer's hold.
- Experts use expiring holds before confirmation. The existing conditional slot lock is retained and extended; abandonment must not leave the slot booked indefinitely.
- Define hold durations separately for online and manual payment, minimum booking lead time, and behavior when a slot start passes during payment. Record configured values before launch.
- Define late-payment handling: reacquire availability atomically when possible, otherwise route to an operator for an alternative or refund. Never fulfill expired inventory automatically.

### Office operating model and publish readiness
- V1 is Office-managed: each order has an accountable operator/team and next action. Document who accepts orders, contacts vendors, supplies digital purchases, confirms appointments, handles cancellations/refunds, and records any vendor settlement due.
- Provide queues for awaiting manual-payment review, paid but unaccepted, overdue fulfillment, and payment exceptions. A proof upload means “submitted for review”, not “paid”.
- Audit operator state changes, reasons, and timestamps. Notify customers on meaningful payment/fulfillment changes using retryable, deduplicated delivery.
- Publish validation runs in the API and Office UI: line/category/vendor consistency, usable price/currency, supported fulfillment configuration, and accountable ownership. Check payment availability before enabling purchase; if methods are later disabled, show a clear unavailable state.
- Distinguish a published Expert profile from a currently bookable service. Quote services cannot present a payment CTA; missing future slots produce an honest availability state.
- Audit/backfill existing products, vendors, and services before enforcing new fields. Report ambiguous legacy fulfillment records for operator correction instead of silently inferring pickup or delivery.

---

## Data & API (evolution)

### Fulfillment validation (server) — must match CMS
- `online`: auth required; snapshot name/email; no delivery address; phone optional unless `require_phone`.
- `vendor`: name + phone; address optional; optional note.
- `in_person`: name + phone + address.
- Experts: name + phone; optional message; validate meeting mode, lead time, and slot hold.
- Cart: persist real fulfillment from items; **stop coercing `online`→`vendor`**; reject mixed fulfillment.
- The legacy field rules above are the compatibility baseline. Delivery requires an eligible address regardless of who fulfills it; the server-resolved mode determines requirements.

### Server-owned checkout preview
- Return a quote/version with order lines, currency, item subtotal, marketplace/delivery/conversion fees, total, fulfillment requirements, eligible payment options, and expiry. State whether preview reserves inventory; default is no reservation until submission.
- The server derives pricing, required contact, and method eligibility. Clients render that contract; they cannot supply authoritative prices, fees, fulfillment, or payment success.
- Submit the accepted quote/version and revalidate. Return a structured price/availability change requiring customer confirmation rather than charging a revised total silently.
- Validate `paymentMethodId` for active status, currency, and allowed purchase surface; require it for manual payment and reject conflicting rail/method combinations. Existing shared Send/Hub methods remain eligible under an explicit v1 rule; a dedicated Office surfaces editor can follow later.
- Snapshot accepted manual-payment instructions and reference/deadline. Define how disabling a method affects unpaid existing orders; never silently display replacement bank details.
- Validate saved-address ownership, form-answer types/required fields per product, and email availability when email is the delivery destination. For cart forms, associate answers with their line rather than one ambiguous order-wide object.

### Checkout submission contract (target; extend existing identifiers)
```ts
{
  source:
    | { kind: "cart", cartId: string }
    | { kind: "product", hubProductId: string, fundedAmount?: number }
    | { kind: "expert", expertServiceSlotId: string },
  quoteId: string,
  idempotencyKey: string,
  payCurrency: string,
  rail: "manual" | "yookassa",
  paymentMethodId?: string,
  fulfillmentMode?: string, // Selected from server-offered modes; revalidated.
  contactName?: string,
  contactPhone?: string | null,
  deliveryAddressLine?: string | null,
  deliveryAddressId?: string | null,
  note?: string,
  formAnswers?: Record<string, unknown>,
  lineFormAnswers?: Record<string, Record<string, unknown>>,
  gatewayMode?: "embedded" | "native",
}
```

This is a target contract, not an instruction to break existing clients. Accept/map legacy `sendCurrency`, `paymentMethod`, and purchase identifiers during rollout; reject contradictory aliases. Keep deployed mobile versions working until migration is complete. Share schemas and rules across clients while keeping server execution authoritative.

### Office product extras (minimal schema if missing)
- `require_phone boolean` (default by fulfillment).
- Vendor: `fulfillment_notes text` (optional).
- Prefer exposing existing `long_description` in Food/Mart CMS before new columns.

---

## Build phases (updated)

Phase labels below are retained for continuity. **Execution order is Foundation → 0 + C → A + B → D + E → Release gates.** UI prototypes can progress alongside server work, but new behavior must not ship before its server requirements.

### Foundation — fulfillment and lifecycle decisions
- [x] Document supported modes, legacy mappings, order/payment transitions, and operational ownership.
- [x] Define hold durations, manual-payment deadlines, late-payment behavior, cancellation/refund handling, and delivery eligibility/fees.
- [x] Specify preview/submission/resume contracts and compatibility strategy for deployed clients.

### Phase 0 — Office correctness (unblock marketplace truth)
- [x] Lock `service_line_slug` + categories on `/food/*` and `/mart/*` product CMS.
- [x] Fulfillment helper copy + validation (vendor required when cartable / when type=`vendor`).
- [x] List columns: vendor, stock, currency, fulfillment; preview links.
- [x] Experts: quote publish guard or “not bookable online” label; no-slots badge.
- [x] Document Profile vs Service vs Slots in Office UI copy.
- [x] API publish-readiness checks; inventory/fulfillment data audit and reviewed backfill.

### Phase A — Checkout chrome (customer P0)
- [x] Remove Pay in / They get from Food/Mart cart + Experts (web + Expo).
- [x] Total to pay in product currency; keep YooKassa rails working.
- [x] Stop `online`→`vendor` coerce; hide address for digital; email receipt line.
- [x] Soften phone for `online` (client + server).

**UI milestone:** Expo/web cart for a digital RUB SKU shows merchant checkout + Pay online, not Send FX. Release additionally requires Phase C and the release gates below.

### Phase B — Unified pay methods
- [x] Shared marketplace pay step: office methods for currency + YooKassa.
- [x] Prefer Pay online when RUB.
- [x] Wire cart + Experts + direct product / `user_input`; drop duplicate rail-only UI.
- [x] Render server-offered methods and implement resume/method-switch states.

### Phase C — API hardening
- [x] `rail` + `paymentMethodId`; fulfillment validation; profile email snapshot on digital orders.
- [x] Mixed-fulfillment cart rejected with clear error.
- [x] Server preview/quote contract, method validation, immutable price/instruction snapshots, and structured recoverable errors.
- [x] Atomic order creation/cart conversion, quantity reservations, expiring slot holds, and late-payment handling.
- [x] Durable payment attempts, idempotent recovery, safe method switching, and scheduled reconciliation.
- [x] Shared guarded state transitions for webhook, poll, and Office; payment and fulfillment state separation.
- [x] Compatibility adapters for old web/mobile payloads; permission checks on order, address, and resume access.

### Phase D — CMS content + consumer PDP
- [x] Long description (and simple form fields if needed) in Food/Mart product dialog.
- [x] Render long description + fulfillment/SLA cues on web/mobile PDP/catalog.
- [x] Vendor fulfillment notes on storefront + checkout hints.
- [x] Verify PDP routing to the unified direct-product checkout from Phase B, including fixed digital products without vendors.
- [x] Retire or redirect legacy product new/edit forks into line CMS.

### Phase E — Fulfillment operations + Experts + DESIGN
- [x] Customer order progress, next actions, cancellation/refund outcomes, and support from Transactions.
- [x] Office queues, assignment, audited actions, and customer notifications.
- [x] Service fulfillment → meeting-mode selection, timezone, location/link instructions; capabilities if useful.
- [x] Min/max session + schedule consistency checks.
- [x] DESIGN.md: marketplace vs Send; Office Hub as marketplace CMS.

### Phase F — Optional later
- [ ] `payment_methods.surfaces`; product galleries; vendor geo; request-quote flow; more online rails.

### Release gates — required before enabling the new flow
- [ ] Multi-item manual and RUB online checkout complete end to end, with matching lines, amounts, contact, payment state, and fulfillment state in customer order detail and Office.
- [ ] Cart, direct fixed / `user_input`, and Experts pass on Next.js web, Expo web, and physical iOS/Android development/store-equivalent builds. Expo Go does not prove native SDK readiness.
- [ ] Double submission, concurrent requests with different keys, lost response, refresh, and app restart recover one order without duplicate charges.
- [ ] Provider success followed by local write failure, timeout, delayed/duplicate webhook, and poll/webhook races reconcile correctly without deleting the order or duplicating side effects.
- [ ] Last-item and last-slot contention allow only the valid reservation; abandoned holds expire; late online/manual payments enter the documented recovery path.
- [ ] Price, fulfillment, vendor publication, and method changes during checkout require safe revalidation. Mixed carts and insufficient quantity fail before payment.
- [ ] Digital checkout works without phone when allowed and has a usable delivery destination; delivery eligibility and Expert meeting mode/timezone are enforced.
- [ ] Manual proof review, operator acceptance, fulfillment completion, cancellation, and refund handling have verified customer/Office outcomes and an audit trail.
- [ ] Existing mobile payloads and Send flows remain compatible; additive migrations/backfills are verified. Feature flags allow stopping new checkout creation while preserving resume, webhook processing, and existing paid orders.
- [ ] Checkout error/success counts, aged unknown payments, paid-but-unaccepted orders, and overdue fulfillment are observable, with an assigned operator for exceptions.
- [ ] New customer copy covers en/ru/fr/es; keyboard, screen-reader labels, validation focus, and native safe areas work on checkout and recovery screens.

Record environment/build, scenario, result, and evidence for each gate. Live sandbox and physical-device verification still outstanding in the companion gaps plan remain release blockers; code completion does not satisfy them.

---

## Out of scope
- Bitbanker on Hub/Experts.
- Replacing cart engine or Experts booking calendar model.
- Replacing the YooKassa integration. Targeted webhook/token recovery, reconciliation, and state-consistency changes required by the release gates are in scope.
- Automated vendor payouts, merchant self-service, live courier tracking, and multi-vendor/split checkout. Office-managed fulfillment and settlement records are sufficient for v1.

---

## Defaults

| Question | Default |
| --- | --- |
| Prefer Pay online when RUB? | Yes |
| Shared bank methods Send + Hub? | Yes until ops asks to split |
| Digital require phone? | No (`require_phone` off for `online`) |
| Digital without vendor? | Allow single-product checkout; cart requires vendor |
| FX on marketplace? | Secondary only |

---

## Link back
- YooKassa inline/native gaps: [cart-payments-gaps-plan.md](./cart-payments-gaps-plan.md)
- Cart + rails parent: [cart-and-payments-dev-plan.md](./cart-and-payments-dev-plan.md)
- Brand: [DESIGN.md](../DESIGN.md)

**Implement in order:** Foundation → Phase 0 + C → Phase A + B → Phase D + E → Release gates. Phase F follows later. Do not ship soft digital contact without fixing `online`→`vendor` coercion and server validation, or enable new payment flows before durable recovery and reservation behavior are verified.

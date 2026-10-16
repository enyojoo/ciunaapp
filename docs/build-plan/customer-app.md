# Customer app build plan (native `mobile/` + web `web/`)

> The gap tables below are out of date. Current done and left lists are in `customer-app-status.md`.

Scope: the 25 cards in `Customer app · Screens` plus customer-facing `Marketplace` components. Source of truth for what differs: each card's README `Upgrade` section. Analysis date 2026-10-16, read-only; nothing here is built yet.

Legend. Native/Web: B = built, P = partly built (needs rework), N = not built. Size: S under a day of focused work, M a few days, L a week or more. API: ok = exists and is enough, ext = exists, needs fields, new = no endpoint.

## 0. Ground facts found in the code

- Two customer clients. `mobile/` (Expo Router, also exported to web under `mobile/dist`) and `web/` (Next, `app.ciuna.com`). They are separate codebases with duplicated components (`mobile/components/hub-cart-bar.tsx` and `web/components/hub/hub-cart-bar.tsx`, both `checkout-pay-rails.tsx`, both `marketplace-checkout.tsx`, `marketplace-pay-step.tsx`, `transaction-timeline.tsx`). Only shared code is `packages/shared` (`marketplace/*`, `hub/service-lines.ts`, `design/tokens.generated.*`, `locales/*`).
- `packages/ui-web` exists (Button, Input, Field, Select, Switch, StatusBadge, Card, Skeleton, EmptyState, Banner, PageHeader, Amount, Sheet, ConfirmDialog, Toast, Tabs, LanguageTabs) but only `seller` depends on it. `web/` still uses its own `web/components/ui/*` (shadcn style: badge, button, card, dialog, drawer, skeleton, tabs ...). Missing from ui-web per plan step 3: Textarea/Label as separate exports are present via form.tsx; Checkbox, DataTable, Stepper, FileDrop are not in the index.
- Mobile theme already reads generated tokens (`mobile/lib/theme.ts` imports `designColors`). But `mobile/components/status-chip.tsx` hardcodes hex pairs and has 5 tones, not the design vocabulary (success/warning/danger/neutral). `statusTone` in `mobile/lib/transactions.ts` maps to pending/processing/completed/failed/cancelled.
- Languages: `SUPPORTED_LOCALES = ["en","ru","fr","es"]` in `mobile/lib/i18n.ts:15` and a separate `Set` in `web/lib/auth-context.tsx:18`; `web/lib/i18n/config.ts` imports only en/ru/fr/es resources. `packages/shared/src/locales/{zh,pt}/{app,common}.json` exist. `web/locales/*` (app, common, emails) has no zh/pt and appears to be a second copy of strings (check whether it is used; both clients import `@ciuna/shared/locales`). `api/lib/i18n` and `web/lib/email-*` also list four languages.
- Tabs: `mobile/app/(app)/_layout.tsx` titles are Home / "Activities" / More. Decision log says keep "More" until copy review.
- API gaps vs designs. Existing and unused by any client today: `GET/PUT/DELETE api/hub/favorites`, `GET api/hub/search?q&line&limit`, `GET/POST api/hub/orders/[id]/messages` (+`/read`), `GET api/hub/messages/unread`, `GET/POST api/hub/orders/[id]/review`, `POST api/hub/orders/[id]/cancel`, `GET api/hub/vendors/[slug]/reviews`, `GET api/expert/profiles/[slug]/reviews`, `GET/POST api/assistant/requests`. No client calls them (grep over `mobile/app|components|lib`, `web/components|app|lib` finds only `hub/cart` and `assistant/requests`).
- Public vendor payload (`api/app/api/hub/vendors/[vendorSlug]/route.ts`) returns photo_url, short_bio, location, pickup_location, pickup_hours, is_verified, rating_avg, rating_count. It does NOT return `cover_url` (column exists on the merchant table), opening hours/closed state, delivery zones, minimum order. Expert profile payload has capabilities, service_area, meeting_hint, rating, but no languages array, credentials, intro video, timezone or next availability.
- Not found in `api/app/api`: customer account deletion (profile screen shows `deleteNotImplemented`, `packages/shared/src/locales/en/app.json:737`), KYC levels and monthly limits, support requests or support chat, push/in-app notification registration, order "report a problem".
- `docs/design-to-build-plan.md`, referenced by `guides/80-decisions.md`, does not exist. This file plays that role for the customer app; fix the reference when this plan is accepted.

## 1. Gap table

### 1a. Screens

| Card | Native | Web | What differs from the card | Size | API |
| --- | --- | --- | --- | --- | --- |
| CustomerHome | P (`app/(app)/hub/index.tsx`, `components/tile.tsx`, `hub-hero.tsx`) | P (`web/app/hub/page.tsx`, `components/hub/hub-service-line-tiles.tsx`, `hub-shell-header.tsx`) | Remove `HubHero` gradient, paper canvas, one muted line, Refer pill + Support pill (message-circle-question icon) in header. Desktop greeting + referral plate is New (defer). Tiles and skeleton built. | S | ok (`hub/service-lines`) |
| FoodHome | P (`hub/[slug]/index.tsx`, `catalog-products.tsx`, `store-item.tsx`) | P (`hub-marketplace-line-home.tsx`, `vendor-hub-catalog.tsx`) | Add search field, category chips, Stores rail with ratings, floating cart bar (a `hub-cart-bar` exists; confirm it matches), offline banner, desktop 4-col. | M | ok (`hub/search`, `hub/vendors`, `hub/products`); category list from products |
| MartHome | P (`app/mart.tsx` redirects to hub line) | P (`web/app/mart/page.tsx`) | Same layout as Food; closed and out-of-stock states; steppers in grid. Build as one shared screen parameterised by line. | S after Food | ok |
| StorePage | P (`hub/[slug]/v/[vendor].tsx`) | P (`hub-marketplace-vendor-storefront.tsx`) | Cover, logo, Verified badge, hours, rating, reviews preview, info plate, favourite, closed state, desktop. | L | ext: add `cover_url`, structured hours/open-now, delivery info, min order to public vendor payload; reviews via `hub/vendors/[slug]/reviews` ok |
| ProductPage | P (`hub/[slug]/p/[productId].tsx`) | P (`web/app/hub/[slug]/...`, vendor catalog) | Gallery with dots, stock counts, fulfilment cards, translation hint, reviews teaser, sticky stepper bar. Today: one image, price, description, Add. | M | ext: multi-image and variants not exposed (`hub-types.ts` has one `image_url`); `stock_quantity` exists in search payload. Variants in the card: confirm product decision (section 6). |
| SearchResults | N | N | New global search screen (`app/(app)/search.tsx`, `web/components/search/*`), results grouped products / stores / experts, recent searches, empty and error states. | M | ok (`hub/search`; min 2 chars, limit 40, `line` filter) |
| Favourites | N | N | Tabs stores / products / experts, undo toast, signed-out prompt, heart on cards (`FavouriteHeart`). Only a product heart "exists" per the card, but no client calls the favourites API. | M | ok (`hub/favorites` GET/PUT/DELETE; GET returns keys + resolved rows) |
| Cart | P (`hub/[slug]/cart.tsx`, `lib/hub-cart.ts`) | P (`web/app/food/cart`, `hub-cart-page.tsx`, `lib/hub-cart-client.ts`) | Minimum-order warning, vendor-lock sheet with two actions (wording change), store plate with Add more. Lines and stepper built. | S | ext: min order value needed in cart response; cart API ok otherwise |
| MarketCheckout | P (`components/marketplace-checkout.tsx`, `marketplace-pay-step.tsx`) | P (`web/components/hub/marketplace-checkout.tsx`) | Three-step layout with progress (summary, fulfilment, pay), pickup variant, zone-not-served banner, pending screen. Method list per currency built. Pay online runs differently per surface (native SDK vs widget); do not change that. | L | ext: zone served check needs delivery zones (new field or `hub/checkout/preview` result); pending screen uses `payment-attempts` ok |
| OrderTracking | P (`app/orders/[id].tsx`, `transaction-timeline.tsx`) | P (`web/components/hub/marketplace-order.tsx`, `transaction-order-detail-page.tsx`, `transaction-timeline.tsx`) | Seller-stage timeline (placed, accepted, preparing, ready/shipped, completed), Message seller with unread dot, rate prompt, Report a problem, cancelled and refunded variants with reasons, delivery/pickup cards. | L | ext: `hub/orders/[id]` returns `fulfillment_state`; verify it exposes stage timestamps, cancel reason, refund state. Report a problem: new (or mailto/Support link first). |
| OrderChat | N | N | Thread screen, day separators, Seen, counter (2000 chars), closed state 14 days after completion. | M | ok (`hub/orders/[id]/messages`, `/messages/read`, `hub/messages/unread`) |
| ReviewFlow | N | N | Rating input sheet/dialog, edit within 48 h, display own review and seller reply. | M | ok (`hub/orders/[id]/review` GET/POST, rules in `api/lib/merchant/reviews.ts`) |
| ExpertsDirectory | P (`experts/index.tsx`, `browse.tsx`, `components/expert-catalog.tsx`) | P (`web/app/experts/*`, `hub-expert-catalog-card.tsx`) | Language chips (6 languages), category chips, from-price, review count, desktop grid, filtered/empty/loading states. | M | ext: languages array and from-price not in `expert/profiles` select list |
| ExpertProfile | P (`experts/[slug].tsx`, `experts/s/[serviceId].tsx`) | P (`expert-profile-view.tsx`) | Verified badge, credentials, availability hint, review summary, ServiceCard rows, unpublished and no-availability states. NOT to build: "Notify me when she opens times" and intro video slot ("Video coming soon"). | M | ext: credentials, languages, next-slot; reviews ok (`expert/profiles/[slug]/reviews`) |
| ExpertBooking | P (`experts/book/[serviceId].tsx`) | P (`expert-booking-wizard.tsx`, `expert-session-checkout-panel.tsx`) | Two-zone time line (viewer and expert zone), notes with visibility line, awaiting vs confirmed, meeting link and add-to-calendar, slot-taken and declined states. | M | ext: expert timezone, booking confirmation state, meeting link (`merchant/expert/bookings/[id]/meeting` exists on seller side; customer read needed in `expert/bookings`) |
| CustomerTransactions | P (`(app)/transactions.tsx`) | P (`web/app/transactions/page.tsx`) | Title Activity, Bookings chip and expert rows, one status chip per marketplace row, minus on outgoing, skeleton rows, error and offline states. | M | ext: confirm `transactions` returns expert bookings (`combined-transaction-service.ts` has no booking grep hits) |
| CustomerSend | B/P (`send.tsx`, `components/send/*`) | B/P (`web/app/send`, `web/components/send`) | Copy: remove provider name ("Bitbanker") from banner and SBP line. Continue becomes Verify identity when required. Payment-waiting screen with countdown and exact amount, failed state, limit error uses verification level. | M | ext: level in limit error needs KYC levels (see CustomerKyc) |
| CustomerKyc | P (`verification/*`) | P (`web/app/more/verification/*`) | Levels with per-level monthly limits (New, numbers are placeholders), native capture with tips, structured rejection reasons, remove hosted provider name. | L | new: levels/limits from Office compliance settings; ext: `kyc/submissions` needs reason codes |
| CustomerAuth | P (`auth/login.tsx`, `register.tsx`, `auth-chrome.tsx`) | P (`web/app/auth/(auth)/*`) | Inline errors instead of toasts, locked state, register rules inline, language chip on every auth screen (New), PIN restyle. Apple/Google text-only marks. | M | ok (`auth/login-attempt` supports locked state; verify) |
| CustomerPin | P (`pin.tsx`, `pin-setup.tsx`, `pin-keypad.tsx`) | P (`web/components/app-lock/*`) | Error line under title, avatar + name greeting, attempts left, locked state, biometric key in keypad, Security settings page. | M | none (local; `lib/pin.ts`) |
| CustomerMore | P (`(app)/more.tsx`) | P (`web/app/more/page.tsx`) | Add Favourites row, merge Privacy and Terms into Legal, green verified tick, teal Refer, "Profile" chip, six-language sheet, in-app sign-out dialog. Tab label stays "More". | S | none |
| CustomerProfile | P (`profile.tsx`) | P (`web/app/more/profile/page.tsx`) | Language row, delete dialog stating retained data and blocked state listing open items, email lock hint. Delete currently unimplemented. | M (UI) / L (delete) | new: account deletion endpoint with blockers list |
| CustomerRecipients | P (`recipients/*`, `components/recipient/*`) | P (`web/app/recipients`) | Row with one trailing delete (48px), in-app delete dialog naming the recipient, field hints, locked-currency note, retry-time toast. | S | ok (`recipients`) |
| CustomerReferrals | P (`referrals.tsx`) | P (`web/app/more/referrals`) | Code plus link copyable, tier progress strip, share sheet, empty state, paused banner, teal pill. | M | ext: `referrals/me` tier/next-tier from Office settings, paused flag |
| CustomerSupport | P (`support.tsx`, `assistant.tsx`) | P (`web/app/support`, `web/app/assistant`) | Contact rows + FAQ + hours exist. In-app chat with a person, requests list, new request form, thread are New. Assistant conversational UI is New. | L | new: no support-requests endpoint; assistant: `assistant/requests` is a notes inbox only |

### 1b. Marketplace components (customer-facing)

| Component | Native | Web | Differs | Size |
| --- | --- | --- | --- | --- |
| ProductCard | P (`components/product-card.tsx`) | P (`hub-marketplace-vendor-storefront.tsx` tile) | Add in-cart stepper, low-stock line, closed-store state, list row variant, zh/ru clamping. | M |
| PriceTag | N (inline) | N (inline; `web/components/ui/amount.tsx`?) | Extract one component over `formatMoney`; unit price and quote. | S |
| StoreCard | P (`store-item.tsx` chip) | P | New with cover, logo, rating, closed, wide variant. | M |
| VerifiedBadge | N | N | New small component; green, icon + word. | S |
| RatingStars | N | N | Display plus input mode with word labels. | S |
| ReviewCard, ReviewSummary | N | N | New; follow `api/lib/merchant/reviews.ts` public shape (`toPublicReview`). | M |
| ServiceCard | N | N | New; replaces plain service rows on ExpertProfile. | S |
| ExpertCard | P (`expert-catalog.tsx`) | P (`hub-expert-catalog-card.tsx`) | Language codes, next availability, unavailable state, favourite, compact row. | M |
| FavouriteHeart | N | N | New `favourite-button.tsx` on both; pressed state, sign-in sheet; optimistic over `hub/favorites`. | S |
| CartLine | P | P | Problem states and stand-alone notice. | S |
| FulfilmentPicker / FulfilmentChip | P (inside marketplace-checkout) | P | Unavailable-option row, pickup hours; chip splits booking into Online and In person. | S |
| OrderSummary | P | P | Stand-alone method list with amount on the button. | S |
| FeeBreakdown | n/a customer | n/a | Seller-side; skip for customer. | - |
| OrderTimeline | P (`transaction-timeline.tsx`) | P (`transaction-timeline.tsx`) | Pickup, cancelled-with-refund, partial refund and booking variants. | M |
| OrderCard, DueTimer, ThreadRow | n/a | n/a | Seller components; not in scope. | - |
| SlotPicker | P (in `expert-catalog.tsx`) | P (in wizard) | Two-zone line, empty-day message. | S |
| ChatBubble | N | N | Day separators, Seen, counter, quick replies, closed state. Quick replies: confirm product need (section 6). | M |
| StatusBadge (customer use) | P (`status-chip.tsx` hardcoded) | P (`web/components/ui/badge.tsx`) | Replace with token-driven badge, unknown words fall back to neutral. | S |

## 2. Shared work first

Order inside this block matters; everything in section 3 depends on it.

S1. Languages (zh, pt). Files: `mobile/lib/i18n.ts` (resources + `SUPPORTED_LOCALES`), `web/lib/i18n/config.ts`, `web/lib/auth-context.tsx:18`, `mobile/components/language-picker.tsx`, `web/components/i18n/language-picker.tsx`, `web/lib/i18n/server.ts`, `web/lib/email-types.ts`, `api/lib/i18n`. Then run a key-parity check of zh/pt against en (missing keys fall back to English silently). Decide the fate of `web/locales/*` (delete or sync) before adding keys, so new strings go in one place: `packages/shared/src/locales/<lng>/app.json`. CJK clamping and 40% text growth need a pass on tiles, chips, buttons.

S2. Status vocabulary. One mapper in `packages/shared` (for example `packages/shared/src/status.ts`): raw status string, payment status and fulfilment state to {tone: success|warning|danger|neutral, word key}. Orange is never a status. Consumers: `mobile/components/status-chip.tsx` (replace hex with `designColors` status pairs, add icon), `web/components/ui/badge.tsx` or ui-web `StatusBadge`, `mobile/lib/transactions.ts` `statusTone`. Unknown words: neutral plus console warning.

S3. Money and primitives. Use `packages/shared/src/money` `formatMoney` everywhere; add `PriceTag` over it in both clients (no `.00` in lists, true minus). Remove local formatting in `mobile/lib/money.ts` if it duplicates.

S4. Web foundation. Decide whether `web/` adopts `@ciuna/ui-web` (add dependency, wire `UiStringsProvider`, migrate screen by screen as plan step 3 says). Recommendation: new customer-web screens use ui-web from the start; old screens migrate when touched. Add to ui-web only what customer web needs: Checkbox, Stepper (checkout progress), Sheet is present. ui-web is a Tailwind web package, so native does not use it.

S5. Native primitives in `mobile/components`. Existing: `primary-button`, `field`, `sheet-picker`, `empty-state`, `inline-skeleton`, `toast`, `status-chip`, `row`, `tile`. Missing: `rating-stars`, `verified-badge`, `favourite-button`, `price-tag`, `review-card`, `review-summary`, `filter-chips`, `search-field`, `confirm-dialog` (in-app dialog replaces `Alert.alert` in recipients, sign-out, delete), `banner` (offline, closed, paused, zone), `avatar` exists. `chat-thread`. Build these once, with a states helper (skeleton / empty / error+retry / offline cached) because every list card requires all four; `lib/use-cached-query.ts` already gives cache-first data.

S6. Web counterparts under `web/components/hub/` or ui-web: `favourite-button`, `verified-badge`, `rating-stars`, `review-card`, `review-summary`, `order-chat`, `review-dialog`, `expert-service-card`, `search/*`, `favourites/*` (names from the cards).

S7. API shape work, so both clients get the same fields (do first because payloads gate StorePage, ExpertProfile, Booking, Checkout):
- Vendor public payload: add `cover_url`, open-now/hours structure, delivery info, minimum order, delivery zones or a served check.
- Expert public payload: languages, credentials, next available slot, from-price, timezone.
- Order payload: stage timestamps, cancel/refund reason, unread count (or use `hub/messages/unread`).
- Transactions: expert bookings and a single normalised status field for the S2 mapper.
- Add the shared TypeScript types to `packages/shared/src/marketplace/types.ts` and consume them from both clients.

S8. Navigation/shell. Keep tab label "More"; add Favourites and Search entry points (Search icon in Home header; check card CustomerHome for the exact placement). `mobile/components/layout/*` and `web/components/layout` untouched except the entry points.

## 3. Work packages (ordered, with dependencies and exit tests)

Each package ships native and web together unless noted. "Device" = iOS simulator and an Android device or emulator; "browser" = `web/` at phone width and desktop width, plus Expo web build when the package touches shared RN code.

**Design baseline (task D0).** WP2 to WP10 (primitives, discovery, store and product pages, cart, orders) start from the reconciled customer cards. Each card now has a "Current" frame (the Expo app as built, extracted from `mobile/components/*.tsx`, `mobile/lib/theme.ts`, `mobile/app/**`) and an "Improved" frame beside it; the card README `Upgrade` section lists Current, Improved (what and why) and Build notes. Build the Improved frame by changing the existing components, not by restyling the app to the old cards. Shared Current-app CSS lives in `design-system/components/current-app.css`; native values missing from the old tokens were added to `tokens.json` (hero gradient stops, `card-edge`, native shadows).

WP1. Language wiring (S1). Depends on nothing.
Exit: switch to Chinese and Portuguese on device and browser from the picker and from the Home/Account rows; relaunch keeps choice; no raw keys on Home, Food, Cart, Send, More; zh and pt parity check script passes; auth, emails still render in en/ru/fr/es.

WP2. Status vocabulary and primitives (S2, S3, S5, S6 first subset: StatusBadge, PriceTag, RatingStars, VerifiedBadge, filter chips, search field, banner, confirm dialog, skeleton/empty/error states). Depends on WP1 only for copy.
Exit: a gallery or temporary screen renders every status word in four tones with icon, nothing colour-only; unknown status renders neutral and warns; amounts show `₽12,500`, `−₽450`, no `.00` in lists; contrast check `npm run design:check` passes; screen reader reads badge word.

WP3. Home and More restyle. Depends on WP1, WP2.
Scope: CustomerHome (remove `HubHero`, Refer and Support pills), CustomerMore, Recipients row/dialog.
Exit: Home shows paper canvas, header with logo, Refer (teal) and Support pills, tiles from Office Hub Services; disabling a service in Office removes the tile on both clients after refresh; no gradient; tap targets 48px; sign-out uses the in-app dialog; recipient delete names the recipient.

WP4. API extensions for marketplace payloads (S7). Depends on nothing; can run parallel to WP1 to WP3. Needs Office/seller data to exist for cover, hours, zones. Product decision needed on zones and min order (section 6) before schema.
Exit: curl vendor, expert, order and transactions endpoints show the new fields; old clients unaffected (additive only); null-safe when merchants have not filled them.

WP5. Discovery: FoodHome, MartHome, SearchResults, StoreCard, ProductCard and PriceTag upgrades, FavouriteHeart + Favourites screen. Depends on WP2, WP4 (cover, rating, hours).
Exit: search finds product, store and expert with 2+ chars, shows "type at least 2" below; category chips and sort change the list; Stores rail shows rating and Verified; heart toggles optimistically, survives restart and appears in Favourites, Undo restores, signed-out opens sign-in sheet; offline shows cached list with banner; closed store and sold-out product show disabled state; desktop 4 columns in browser.

WP6. Store and product pages. Depends on WP5.
Exit: store page shows cover, logo, Verified, hours, rating, reviews preview, closed state blocks Add; product page gallery swipes with dots (if multi-image shipped), stock count and sticky stepper work and sync with cart.

WP7. Cart and Marketplace checkout. Depends on WP2, WP4 (min order, zones).
Exit: cross-vendor add opens the lock sheet with two actions; below minimum shows warning and disables Checkout; three-step progress works with back; pickup hides address; unserved zone shows banner and blocks pay; pay-online widget on web, native SDK on device unchanged; pending screen appears after bank transfer proof upload; totals add up to the cent in breakdowns.

WP8. Orders: OrderTracking, OrderTimeline, OrderChat, ReviewFlow. Depends on WP2, WP4 (order payload). Chat and review APIs exist, so these can start before WP7 finishes.
Exit: a test order walked through accepted, preparing, ready, completed in Seller shows each stage live in customer timeline on both clients; message seller sends and the Seller portal receives it (`merchant/messages`), unread dot clears on open; chat is read-only 14 days after completion; review can be submitted after completion, edited within 48 h, blocked after; seller reply shows; cancelled and refunded variants display the reason and refund.

WP9. Experts: Directory, Profile, ServiceCard, ExpertCard, SlotPicker, Booking, reviews. Depends on WP2, WP4 (expert payload), WP5 (heart).
Exit: language and category chips filter; profile shows verified, credentials, review summary; booking shows both time zones (viewer and expert) on slot and on confirmation; awaiting vs confirmed state matches seller action; slot-taken race shows the error and returns to slots; no intro video slot and no "notify me" button rendered.

WP10. Activity (Transactions). Depends on WP2, WP4 (normalised status, bookings).
Exit: Activity lists send, food, mart and expert bookings with one chip each, minus on outgoing; Bookings chip filters; skeleton rows on first load only, cached content never replaced by skeleton; error with retry; offline cached.

WP11. Account surfaces: Referrals, Profile (UI, delete blocked state), Pin/Security, Auth, Send copy changes. Depends on WP1, WP2.
Exit: referral code and link both copy; tier strip matches Office settings; PIN wrong entry shows inline error and attempts left; locked state after limit; biometric key in keypad on device that supports it; login errors inline (no toast), locked state; Send screens no longer name any provider (grep customer strings for provider names in all six languages); Verify identity button replaces toast redirect.

WP12. KYC levels and rejection reasons, native capture. Depends on API work not covered above (levels, limits, reason codes) and on a decision on the hosted provider (section 6). Largest and least defined; schedule last of the customer-critical items.
Exit: user sees level, remaining monthly limit from Office settings; capture flow guides on a device camera; rejected submission shows a structured reason and a retry path; provider name appears nowhere.

WP13. Support and Assistant (in-app chat, requests). Depends on a backend that does not exist. Do not start until section 6 questions are answered.

Parallelism: WP1, WP4, WP2 can proceed together. After them: WP3 || WP5 || WP8 || WP11. WP6 and WP7 follow WP5/WP4. WP9 and WP10 follow WP4. WP12, WP13 last.

## 4. Per-package verification checklist (applies to every WP)

- Four list states exist: skeleton on first load only, empty, error with retry, offline cached.
- Tap targets 48px, labels readable at 200% text size, nothing relies on colour.
- Orange only on primary action and selected state; orange text uses `primary-text`.
- No provider names in customer strings (check all six locales).
- `npm run design:check` and the repo type-check and lint pass for `mobile`, `web`, `packages/shared`.
- Smoke on iPhone simulator, a small Android screen, `web/` at 375px and 1280px, and the Expo web export (`mobile/dist`) for shared RN screens.

## 5. Risks

1. Two codebases, duplicated components. Every change is done twice and drifts. Mitigation: put types, status mapping, formatters, copy keys and pricing logic in `packages/shared`; accept two view layers.
2. API gaps hidden behind a "S" UI. StorePage, ProductPage (gallery, variants), MarketCheckout (zones, min order) need schema decisions with Seller and Office. Cover and hours need Seller to capture them; check `seller/` store profile editor and `office` before assuming data exists.
3. i18n silent fallback. zh and pt may be missing keys for newly added strings; the new strings in this plan must be added to all six. CJK line-height and clamping.
4. Pay online differs per surface (widget on web and Expo web, native SDK in store builds). Checkout restyle must not break `yookassa-checkout-widget(.web).tsx` or `lib/yookassa-native.ts`; re-test both.
5. Status mapping changes copy and colour of existing rows; check emails and Office that reuse labels.
6. Expo web vs `web/`: two web surfaces. Confirm which one is the shipped customer web before polishing both (decisions say both exist; `mobile/dist` is checked in or generated).
7. Chat and reviews expose moderation exposure (abuse, PII). Check Office moderation (`admin/reviews` exists, chat moderation does not appear).
8. Account deletion and KYC limits touch compliance and retention rules; legal review before UI copy states what is retained.
9. Keep "More" tab label; two sources (card says Account) will confuse QA.

## 6. Open product questions

1. Delivery model: delivery zones, "zone not served", minimum order, delivery fee. Where configured (Seller store settings or Office)? Today only `pickup_*` fields exist.
2. Opening hours and "closed" state: is closed blocking checkout, or allow pre-order?
3. Product variants and multi-image gallery: does the catalog model support them? If not, ship single image and defer variants.
4. Report a problem: a Support request, a refund flow, or a mailto? No endpoint exists.
5. Support chat and requests: who staffs it (Office tooling absent), what hours (reply-time promises are shown only if Office sets hours).
6. Assistant: Insurance, Assistant etc. are office-off. Keep the assistant unpolished?
7. Account deletion rules: what is blocked (open orders, referral balance, pending transfers) and what is retained.
8. KYC: levels count, limits source (Office compliance settings), hosted provider replacement or keep with provider name removed from copy.
9. Expert booking: auto-confirm vs seller-confirm ("awaiting" vs "confirmed" requires seller accept flow); cancellation and refund window; meeting link source.
10. Chat quick replies: answered, customer-visible (see 80-decisions item 9).
11. Desktop greeting and referral plate on Home (New).
12. Favourites on stores and experts: show in Activity or More only?
13. Does `web/` adopt `@ciuna/ui-web` fully or only for new screens? What happens to `web/locales/*`?
14. Is Favourites/Search entry in the header or in the tab bar?

## 7. Do NOT build yet

- Any invented numbers on cards: KYC limits (₽50,000 / ₽600,000 / ₽2,000,000), referral tiers (0.5%, 0.75%, 1%), commissions (8%, 6%, 12%), withdraw fee 1%, support reply times, Telegram expiry. Read from Office or API; render nothing if absent.
- ExpertProfile "Notify me when she opens times" and the "Video coming soon" intro video slot.
- Support in-app chat, requests list and new-request form until a backend and staffing exist (WP13).
- Conversational Assistant, suggestions, actions and handoff.
- Desktop greeting and referral plate on Home.
- Withdraw via Ciuna Send (Coming soon only), referral payout beyond the current endpoint.
- Biometric glyph other than the `scan-face` icon; Apple and Google brand marks (text only).
- Anything labelled New in a card's Upgrade that depends on data not in the API (credentials, intro video, delivery zones, min order) before WP4 lands the fields and Seller/Office capture them.
- Seller-only components (FeeBreakdown, OrderCard, DueTimer, ThreadRow, EarningsTile, ...) are not part of the customer app.

# Audit B: customer cards vs Expo app

Scope: StorePage, ProductPage, Cart, MarketCheckout, OrderTracking, OrderChat, ReviewFlow. Read-only. Paths are under /Users/a1/Projects/ciunaapp/mobile unless noted.
Legend: MISSING / MISMATCH / NEEDS-BACKEND / OK. Several card READMEs are stale (they say "not built" for things that are built); noted per card.

## Cross-cutting
- MISMATCH: OfflineBanner (`components/offline-banner.tsx:15`) is placed at `bottom: insets.bottom + 88` (above the tab bar). On screens with no tab bar (order chat, checkout) it lands on the composer / quick-reply chips. Visible in `design-system/reference/current-app/shots/order-chat.png`. Fix: position it from the layout (above the tab bar only when a tab bar is shown).
- MISMATCH: money in cart, checkout and order summary uses `formatMoney` (always cents: "₽900.00", "₽1,150.00"). Cart README rule: no cents on whole amounts in lists, cents only in breakdowns. Use `formatCardPrice` for cart line totals and the Checkout button label (`cart.tsx:185,188,262`).
- Desktop: cart, checkout, product and order use `NARROW_COLUMN` (720px centred). None builds the card's desktop layouts (product two-column with 320px side, store three-column with side column).

## StorePage: Mostly
Reference: README Upgrade + `shots/store-page*.png` (preview.html is the old layout). Code: `app/(app)/hub/[slug]/v/[vendor].tsx`, `components/store-header.tsx`, `catalog-products.tsx`, `reviews-section.tsx`.

Deliberate deviations (not gaps): ProductCard kept as the old app card; cover uses line art until stores upload; hub top bar; fixed header slots; hours as a chip on the cover; closed/paused store handling; delivery fee/minimum per area cut (minimum per store).

Findings
- README stale: Share IS built (`[vendor].tsx:60`, `ShareButton`). Paused state IS built in the UI (`lib/store-hours.ts:19` returns "Temporarily unavailable"); only the "direct link shows This store isn't available" part is not (see below).
- MISSING (NEEDS-BACKEND for the unlisted case): paused store opened by direct link should show "This store isn't available". App shows the normal page with a chip. Needs the public vendor endpoint to return paused stores with a flag or 404; the app already has `is_paused` in `HubVendor` (`lib/types.ts:94`), so the app part is small: in `[vendor].tsx:80` treat `vendor.is_paused` as not found if the card is followed. Decide first; the later decisions say paused behaves like closed (browsable, checkout blocked), which contradicts the card. Treat as OK pending owner call.
- MISSING: closed store muted cover and clock in place of Add on product rows. `StoreHeader` shows only the chip (`store-header.tsx:80`); products are not dimmed and Add stays active on a closed store (checkout is blocked later in the cart). Card: "Closed stores can be browsed but not added to". Decision 2026-10-17 says "Customers can still browse and add to the cart", so this is a deliberate deviation. OK.
- MISSING: delivery time and fee on the store header status line (card: delivery time, fee, minimum). Only the minimum order is shown, in the info plate. Fee/time are per delivery area, and the area model was cut for v1 per decisions. NEEDS-BACKEND if wanted (store-level "from fee / ETA" in the vendor payload; checkout already computes `fromFee`/`etaMinutes` from zones in `marketplace-checkout.tsx:~337`).
- MISSING: category chips jump to sections; app filters instead (`catalog-products.tsx:57-73`). Behaviour differs, filter is arguably fine. MISMATCH, low.
- MISMATCH: product list is the two-column ProductCard grid, not 80px photo rows with 44px add (card). Deliberate (owner revert, ProductCard stays).
- MISSING: info plate (hours, address, delivery) is shown only when the fields exist; the weekly opening hours schedule is not listed anywhere (only "Open until"/"Closed · opens"). `storeOpenLine` has the data; consider a weekly hours row. NEEDS-BACKEND only if the public payload lacks the schedule (it exposes `opens_at`/`closes_at` only).
- MISSING: reviews preview of two cards with See all; app shows summary, distribution and three reviews with Show more (`reviews-section.tsx`). Different but richer; logged in reconciliation. OK.
- MISSING: desktop three-column menu and side column (hours, delivery, latest review). Screenshot `store-page-1280x800.png` shows single column with info plate stacked above a 4-up grid.
- States: first-load skeleton OK (`store-header.tsx:45`, `catalog-products.tsx:76`; the skeleton does not include a reviews or info placeholder, fine). Empty: OK ("No products available yet." with no icon). Error: MISMATCH. `[vendor].tsx:44` treats any fetch error as "Store not found" with no Retry; a network failure should say "Couldn't load" with a retry button (`LoadError` exists). Offline: OFFLINE pill only; the "cached menu with a banner" is covered only if `useHubVendorStorefront` is cached (not verified). Long text: name one-line ellipsis OK; bio and notes wrap OK. 320 wide: info plate wraps, header row `gap 14` with 76px logo leaves ~150px for the name; OK. Images: cover and logo use RN `Image` without placeholder (store-header uses `react-native` Image, not expo-image; no fade or cache); gradient shows behind only when url missing. Low.

## ProductPage: Partial
Code: `app/(app)/hub/[slug]/p/[productId].tsx`, `components/product-gallery.tsx`, `price-tag.tsx`, `product-card.tsx` (`VendorChip`).
Deliberate: sticky bar, reviews teaser not built (README says so; no product reviews exist).

- MISMATCH (bug): the SLA chip renders "Usually Within Ready In 30 Min" (`[productId].tsx:164-172`, screenshot `product-page.png`). Template "Usually within {{duration}}" is wrapped around `sla_text` that already reads "Ready in 30 min", and the style `textTransform: capitalize` (line 299) title-cases it. Fix: show `sla_text` as is (no template, no capitalize), or only wrap pure durations.
- MISMATCH: order of elements. Card: title, price (with old price), stock badge, vendor row, fulfilment cards, description, reviews teaser, sticky bar. App: title, stock line, chips, vendor, description, then price with a "Sell price" prefix (`:197-211`), then Add button, then More from store. Price is below the description; on long text it falls off-screen. Move price directly under the title; drop the "Sell price" prefix for fixed price items (card shows just ₽520 ₽650).
- MISSING: fulfilment as two radio cards (Delivery: time and fee; Pickup: address and ready time). App shows a plain "Delivery"/"Pickup" chip from `fulfillment_mode`. NEEDS-BACKEND: product/vendor payload has no delivery fee, ETA or pickup address (`HubProduct.vendor` in `lib/types.ts:30` carries only min order and hours). Pickup address/hours exist on `HubVendor` (`pickup_location`, `pickup_hours`) but not in the product's vendor stub; extend the product API vendor select. Delivery fee and ETA are zone-based, so only a "from" fee is possible.
- MISSING: stock badge as a badge with icon; app shows muted/warning text only (`:150`). "Stock is a word and an icon, never colour alone": the word is there, the icon is not. Low.
- MISSING: Sold out badge near the title, dimmed fulfilment. App only disables the button (label "Sold out"). If `cartQuantity > 0` and the item then sells out, the stepper still shows (`:220`). Low.
- MISSING: vendor row details (rating and city, opens the store). `VendorChip` shows logo, name and verified only (`product-card.tsx:230`); rating lives in the vendor reviews summary, not in the product payload. NEEDS-BACKEND (add `rating_avg`, `rating_count`, `location` to the product's vendor object).
- MISSING: translation hint with Show original. NEEDS-BACKEND: the seller-translation fields are not in the product payload or type. (Decisions cut "translation hint" for v1: Cut for v1 list; so deliberate.)
- MISSING: quantity stepper before adding, and sticky bar with "Add to cart · ₽650". App has a plain Add button that turns into a stepper after the first add; total is not in the label. README says sticky is not built. Low priority but the button should name the total (card rule "Buttons name the action and the total").
- MISSING: favourite and back are on the top bar instead of over the gallery (deliberate hub top bar).
- MISMATCH: gallery is 4:3 (`product-gallery.tsx:65`), card is square. On desktop the 4:3 gallery fills the 720px column (shot `product-page-1280x800.png`: image taller than the viewport, title below the fold). Cap the gallery height on wide screens or use the two-column layout.
- OK: multi-image swipe with dots, strike-through list price, low stock under 6, vendor lock dialog (`use-guarded-add.tsx`; it is a centred ConfirmDialog, not a sheet, and does not name the new store).
- States: skeleton OK (`:111`, 4:3 block + bars). Error: MISMATCH. `:127` shows "Product not found." for any error including network failure; no Retry. Offline: product comes from a cached query, so it opens offline; Add shows a toast on failure only. Long text: title has no `numberOfLines`, wraps (OK). 320 wide: OK.

## Cart: Mostly
Code: `app/(app)/hub/[slug]/cart.tsx`, `lib/hub-cart.ts`, `lib/use-guarded-add.tsx`.
Deliberate: no payment methods; hub top bar with "Cart" title.

- MISMATCH: Checkout button is not sticky; it is the last item in the scroll (`cart.tsx:258`). Card: "sticky Checkout · total".
- MISMATCH: stepper is 28px buttons / 28px remove (`styles.stepperBtn` `:334`), the card says 44px steppers. Touch targets are small; `hitSlop 8` helps but the visual is small. Raise to 44 (or 40 with hitSlop 4).
- MISSING: minus at quantity 1 should remove after a confirmation swipe-undo toast. App: minus at 1 sends quantity 0, which silently deletes the line (`hub-cart.ts:341`), and the bin button removes instantly. No Undo toast. Add an undo toast (`useToast` exists).
- MISSING: store plate "delivery time" (card: "Delivery · 35–50 min") and summary Delivery row. App says "Delivery is added at checkout." (`:235`); total excludes delivery. Cart total therefore is lower than the final total. Delivery fee/ETA are per zone after address, so this is NEEDS-BACKEND for a "from" estimate; the copy fallback is acceptable.
- MISMATCH: below-minimum is a small orange centred text line (`minNote :295`), not a warning banner with "Add ₽120 more to check out", and Checkout stays enabled for delivery by design. Card says Checkout disabled. Since pickup has no minimum, the app's enabled button is deliberate; but the visual should be a banner with an icon. Same for closed and unavailable notes (`blockedNote`): plain text, not banners.
- MISMATCH (visual bug): the summary plate has an empty top block: `subtotalRow` has `marginTop: 16` and its own top border inside a padded plate, so there is a blank gap and a stray divider above Subtotal (screenshot `cart-filled.png`). Remove marginTop/border from `subtotalRow` (`:337-345`).
- MISSING: line "option" (e.g. "Medium spice") under the name; no option data in the cart item (variants are deferred per decision 3). OK.
- MISMATCH: thumbnails use `resizeMode="contain"` in a 56px box, with an empty tile when there is no image (`:177-180`); products with no image show a blank grey tile. Use cover and the "No image" placeholder.
- MISMATCH: "Add more" calls `router.back()` (`:147`), which leaves the app on whatever page came before (can be the checkout or home). Link to the store page: `hubMarketplaceVendorPath(line, vendor.slug)`.
- MISSING: loading skeleton does not include the store plate/summary (just three rows). Low.
- MISSING: error state. `useHubCartByLine` exposes `error` (`hub-cart.ts:277`) but the screen ignores it (`:104-130`): a failed load with no cached cart shows "Your cart is empty." Show LoadError with retry (`refreshHubCartByLine`).
- MISMATCH: empty state action says "Browse Food" for Mart carts too (`:125`).
- OK: vendor lock (names the old store; two clear actions; does not clear silently), unavailable lines muted with Remove and Checkout disabled, closed-store note with opening time and disabled Checkout.

## MarketCheckout: Partial
Code: `components/marketplace-checkout.tsx` (`MarketplaceCheckout`), `marketplace-pay-step.tsx`, `step-bar.tsx`, `app/(app)/hub/[slug]/checkout/*`. Reference: README Upgrade + `shots/checkout-page.png`.
Deliberate: inline frame under the summary (not a screen); two-step Details/Review with Edit; narrow centred column; closed-store banner and blocked checkout; provider not named in our copy.

- MISSING (functional): contact name and phone fields. Card Details starts with contact (name, phone). The app has no inputs for them: `c.contactName`/`c.contactPhone` are only seeded from the profile (`:196-199`; no `setContactName` call anywhere in `mobile/`) and shown as a recap on Review (`:695`). If the profile has no phone and the line requires one, `canAct` stays false (`:251`) and the customer cannot continue and cannot fix it. Add two `Field`s in the details section using `c.setContactName/c.setContactPhone` (both exist in `packages/shared/src/marketplace/use-checkout.ts:357-359`).
- MISMATCH: Delivery/Pickup is a stack of radio cards (`Choice`, `:36-56`), not the segmented control. Delivery choice is zone radios ("City · District · fee · min") plus an address field, not "address fields + delivery-zone plate with fee". Acceptable but different.
- MISMATCH: pay step shows "Pay with: Pay online | Bank transfer" tabs and a manual receipt upload (`marketplace-pay-step.tsx:~145-215`) whenever the store has a manual method. Decisions (Marketplace payment corrected) say no pay-method list; the frame is the only choice. Owner call needed; if the decision stands, hide the tabs and manual rail for marketplace orders.
- MISSING: explicit "Pay ₽X" primary button on web. The widget mounts automatically (`useEffect :306`, skeleton "Loading secure payment…") and `hideOnlineCta` is passed. Native shows "Pay · ₽X" after the order exists. Card and 80-decisions both said "confirm against the running app"; the card should be updated or the button added. Also "Opening secure payment…" full state: replaced by `OnlinePaySkeleton`; copy differs.
- MISSING: states "waiting for confirmation" ("Checking payment. Please don't pay again."), and "frame closed/cancelled" neutral banner. `nextAction === "checking"` keeps the pay step (`:61`) but there is no message or pending badge; the API error text PAYMENT_UNRESOLVED exists in locales (`locales/en/app.json:1203`) but is only shown if an action fails. The payment frame can be re-opened while checking: card rule "never allow a second payment while checking". Add a banner and disable pay when `nextAction === "checking"`.
- NEEDS-BACKEND: paid state with method name ("Bank card ····4242" or "SBP"). `MarketplaceAttempt` (`packages/shared/src/marketplace/types.ts:102-111`) has no method label or last4; the order view shows only "Payment: Paid". Needs the YooKassa payment method (type, card last4) stored on the attempt and returned in `/api/hub/orders/:id`.
- MISMATCH: summary content. Card Review: lines, subtotal, zone fee, total. App: lines, then "Service fee" and "Delivery fee" rows (even at ₽0.00, see shot), a "Conversion fee" row if present, and "Total to pay" (`SummaryCard :95-150`); no Subtotal row. Service fee is not drawn in the card; hide zero rows, add Subtotal. The summary is shown above the details on step 1 rather than only on Review.
- MISMATCH: delivery fee shows ₽0.00 before a zone is chosen, and the total excludes it, so the Total changes after selection with no prompt. Show "Choose a delivery area" in the fee row until selected.
- MISSING: address-required inline error (card state). App just disables Continue (`:260`, `canAct`) with no field error message; Continue disabled without telling why (only a "Choose a delivery area" meta line).
- MISSING: "zone not served" options "change address or pick up": pick-up is offered; change address is not applicable (zones are listed, not matched to an address). OK-ish.
- OK: min-order banner with Pick up instead; closed banner; delivery/pickup hints with from-fee and ETA (`modeHint`); step bar; error box with translated codes; cancel order button; boot spinner.
- States: skeleton: `ActivityIndicator` only when no seed (`:455`), otherwise the seeded summary shows instantly (good). Error: errorBox with retry copy but no Retry button; the user taps Continue again. Offline: no offline-specific message. 320 wide: Choice labels `City · District · fee · min` wrap (no numberOfLines), OK. Small: StepBar fine. Desktop: 720 centred column; the card's widget below the summary is OK.
- MISMATCH: top bar title "Checkout" back chip goes to the line home (`checkout/index.tsx:108`, `backHref={hubLineHomePath}`) rather than the cart when there is no history (`goBack` falls back). Low.

## OrderTracking: Partial
Code: `app/orders/[id].tsx` (default export, picks `MarketplaceOrderView` in `components/marketplace-checkout.tsx:~735-1000`), `order-status-header.tsx`, `order-timeline.tsx`, `seller-chat-card.tsx`, `review-sheet.tsx`. Reference: `shots/order-detail.png`.
Deliberate: link text "Contact support" (not "Report a problem"); seller rating on the order cut; Message seller as a row plus sticky bar while live; flat order summary.

README is stale: status header, delivery/pickup place card (`OrderPlaceCard`), per-step times from events, cancel reason, chat-open-until line and the desktop side panel (`orders/[id].tsx:855-865`) are all built.

- MISMATCH: top bar. Card: back, order number, "store · placed" line. App: hub top bar title "Order" (screenshot) or native header; the order number is in the summary card, store name is the card title. Pass title/subtitle through the header.
- MISMATCH: section title above the timeline reads "How you get it" in the shot (`label("fulfillment")` used at `marketplace-checkout.tsx:~856`, which is the delivery-method string). Use "Order progress" key.
- MISSING: awaiting-payment banner with "Complete payment" above the timeline. The app instead renders the whole payment step inline below (`pay && methods.length > 0`), far below the timeline and event list. The status header does say "Complete your payment" (statusLine) but has no button. Add a banner with a scroll-to or the primary action at top.
- MISSING: "next time that matters" in the status header (estimated delivery, pickup hours; zone ETA with time zone). NEEDS-BACKEND: the order snapshot has no ETA; only `pickupHours` exists (shown in the place card). Store an ETA on the order or compute from zone `etaMinutes` at placement.
- MISSING: items with photo (card: photo, name, qty, line price). Order lines in the snapshot have `id/quantity/title/unitPrice` only (`SummaryCard :88-98`); NEEDS-BACKEND: add `imageUrl` to snapshot lines.
- MISMATCH: refund/cancel. Card: cancelled-before-payment "Not charged"; refunded: cancel reason, grey Refunded step with timeframe and amount, minus sign in breakdown. App: reason text is shown in the status header (OK), Refunded step has time only; no amount, timeframe or "Not charged"; breakdown has no minus. NEEDS-BACKEND for refund amount and expected timeframe (not in order payload).
- MISSING: seller card with rating (cut for v1, deliberate) and the avatar+name; the row shows icon/photo + "Message seller" + seller name (OK).
- MISSING: payment card with status chip and method name. App shows a muted "Payment: Paid" line inside the summary (`SummaryCard :143-150`). Method name NEEDS-BACKEND (see MarketCheckout).
- MISMATCH: rate prompt. Card: "How was your order?" with five empty stars and Rate this order. App: card "Rate your order / How was it?..." with a Rate button (`OrderReviewCard`), logged in reconciliation. Deliberate.
- MISMATCH: support. Card/decision 4: support opens a request pre-filled with the order. App opens `mailto:support@ciuna.com?subject=<id>` (`marketplace-checkout.tsx:~976`), shown on every order including unpaid; `/support/new` supports an `orderId` but has no route param prefill (`app/support/new.tsx:25`). Decision 2026-10-17 only fixed the wording. Change to `router.push({pathname:"/support/new", params:{orderId}})`, read the param in new.tsx, and show only for paid orders.
- MISMATCH: extra content not in the card: a raw event list ("Order updated" + date) below the chat link (`:~935`) duplicates the timeline; the Cancel order button sits above the receipt/support buttons. Remove the event list or fold it into timeline times.
- MISSING: timeline wording. Card steps: Accepted by seller, Preparing, Ready, Delivered/Completed. App: Order placed, Paid, Accepted, In progress, Fulfilled (README admits no per-stage data). NEEDS-BACKEND for Preparing vs Ready; pickup variant ("Ready for pickup") also absent. The timestamp for each step uses event kinds (paid, accept, start, fulfill, cancel, refund), OK.
- MISSING: times with zone on estimates. N/A until estimates exist.
- States: loading is a bare text "Loading" (`orders/[id].tsx:872`), not the skeleton card layout. Error: the same bare text (`marketplace.retryError`) with no Retry and no title; card: "Couldn't load this order" with Retry. A legacy transfer order has its own good retry. Both are MISMATCH, easy fix with `LoadError`/skeleton blocks.
- Behaviour: `MarketplaceOrderView` polls every 5s forever (`:~790-797`), even for completed/cancelled orders; stop when terminal. Offline: poll fails silently, no stale marker beyond the global pill.
- 320 wide / desktop: stack layout is fine; desktop side panel built; the chat panel hides the Message seller bar (`chatInline`).

## OrderChat: Mostly
Code: `app/orders/[id]/chat.tsx`, `lib/order-chat.ts`, `lib/chat-panel.ts`, `seller-chat-card.tsx`. Reference: `shots/order-chat.png`.
Deliberate: native header for back + seller name; no response-time line (cut for v1); quick replies customer-visible; "Report a problem" wording replaced by Contact support.

README/reconciliation stale: quick replies, desktop side panel, Enter-to-send, counter all built.

- MISMATCH: order strip shows order id + title only (`chat.tsx:340-349`); card strip has order number, items, total and a status badge, linking to the order. Needs the order payload's totals and status (already loaded at `:111`), so it is a front-end change.
- MISSING: seller avatar in the header; the header is the native title (name only, `:80`). Info button not built (not in cut list; low).
- MISSING: closed banner "Report a problem" action. Use "Contact support" linking to the pre-filled support request (see OrderTracking).
- MISMATCH: not-yet-available state hides the composer entirely (`:381` requires `available`); card shows a disabled composer with the counter and Complete payment as the single action. Minor.
- MISMATCH: send error shows "Not sent / Retry" but not the reason line ("No connection. Message was not sent."), and rate-limit banner has no title/body split. Low.
- MISSING: unread dot on the order row in Activities. `useChatUnread` is used only by the order screen and `app/(app)/_layout.tsx` (tab badge). The transactions list (`app/(app)/transactions.tsx`) has no dot. Data is available: `/api/hub/messages/unread` returns per-order counts, so no backend change.
- MISMATCH: offline pill overlaps the composer chips (cross-cutting).
- OK: day separators, "Seen" on last outgoing only, 2000 counter turning destructive and disabling Send, draft kept on rate limit and chat-closed, card-number hint, skeleton bubbles, empty state, closed banner with date (closesAt, else completion + 14 days), retry on first-load error (`LoadError`), Enter sends and Shift+Enter newline on web, 320 wide fine (bubbles 82%).
- Behaviour: polling every 5s continues when the chat is closed or the order unpaid; stop when `thread.closed`. Scrolls to end only on row count change, so opening the keyboard does not re-scroll (low). Empty state has no icon and the chips are hidden once text is typed (intended).

## ReviewFlow: Mostly
Code: `components/review-sheet.tsx`, `rating-stars.tsx`, `reviews-section.tsx`, `lib/use-reviews.ts`, `web-aware-modal.tsx`.
Deliberate (reconciliation): inline "Rate your order" card opening a sheet (dialog on desktop); reviews are a section on the store page, not a tab; no Reviews tab.

README/reconciliation stale: the "Rate your session" variant IS built (`review-sheet.tsx:79,138`).

- MISSING: sheet header context "Mama T's Kitchen · CIU-0987" under the title (card). `ReviewSheet` receives only `orderId`/`line`; pass store name and public id (the order is in scope in `MarketplaceOrderView`).
- MISSING: "Tap a star" prompt text before a rating (app leaves a blank line, `:230`); the word appears only after a pick. Low.
- MISMATCH: locked sheet has no Close/neutral button and the note text differs ("This one is now locked" vs "You can no longer edit this review. It stays visible on the store page."). Edit line differs ("until {{date}}" vs "Written 5 hours ago · 43 more hours"); fine.
- MISMATCH: window-closed (30 days) state. App hides the whole card when `canReview` is false (`:61`); card draws a sheet "The review window has closed" (README says "no sheet"). Follow README; OK.
- MISMATCH: store page distribution bars show counts, card shows percentages (`reviews-section.tsx:40`). Seller reply label "Reply from the seller" vs "Reply from {store}" with date (`:93`); `reply_at` is in the type but not shown. Low.
- MISSING: own-review card shows "Your review" + stars, not "Written just now · name" with Edit review button; uses a small Edit/View pill. Low.
- OK: 48px stars, submit disabled until a star, optional text, 1000 counter, first-name notice, edit-until line, busy button, translated error ("Couldn't post your review. Try again."), 429 and ALREADY_REVIEWED handling, thank-you toast, modal/dialog on desktop, 320 wide fits (256px stars row), reviews load error with retry, skeleton, empty text, Show more.
- Behaviour risk: `onSaved` closes the sheet but the draft is discarded on error? No: error keeps text. A network failure shows the generic error (OK). Offline state not distinct.

## Top fixes by value
1. Checkout: add contact name/phone inputs (blocks users without a phone). 
2. Checkout/pay: "Checking payment" state and block double pay; hide manual/"Pay with" tabs if the decision stands.
3. Product SLA chip copy bug; move price under title; fulfilment info; button names total.
4. Cart: sticky Checkout, 44px steppers, undo on remove, stray gap above Subtotal, no cents on lists, show load error instead of empty cart, "Add more" to the store.
5. Order: skeleton and Retry on load, "Order progress" heading, "Complete payment" banner on top, support pre-filled request, drop event list, stop polling when terminal.
6. Offline pill overlap on chat/checkout.
7. Chat: order strip with items/total/status; Activities unread dot.
8. Error-vs-not-found on store/product (retry).
9. NEEDS-BACKEND batch: product vendor rating/location and pickup address; vendor "from fee"/ETA; order ETA; snapshot line images; payment method name; refund amount/timeframe; seller-translation fields; paused-store payload behaviour.

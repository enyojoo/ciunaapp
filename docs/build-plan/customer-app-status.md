# Customer app: done and left (updated 2026-10-17)

This replaces the gap tables in `customer-app.md`, which are stale. It covers the native app in `mobile/` only. The web app in `web/` has not been audited (see "Web app" below).

## Done

**Home and discovery**
- Home: sticky header (logo, Refer, avatar), purpose slider, drawn service tiles, no search. Dynamic height on small and large phones.
- Food and Mart home: pill search field scoped to the line, stores rail, category chips (shared `FilterChips`), product grid.
- Product card: fixed slots (one-line name, cue line, store, price), low-stock note, shared `PriceTag`, favourite heart (34px, 48px target).
- Store page: `StoreHeader` with fixed slots so every store has the same header height (cover scales with screen width, open state chip on the cover, one-line name, location, rating and count), minimum order line, pickup plate, reviews, skeleton.
- Store card: cover image, closed state, verified tier.
- Product page: swipeable gallery with dots, stock line, favourite in header, skeleton.
- Search, favourites, empty states: built earlier. Skeletons now on product, store, cart, activity and expert browse.
- `VerifiedBadge`: one component, two tiers (individual, registered business).
- One top bar (`HubTopBar`) on Food and Mart, store, product, cart, checkout and the expert profile, service and booking screens: same back chip, bar height, hairline and action position, measured identical in screenshots. Content starts 16px under it.
- Search: first four results per group in All with a See all link.

**Cart, checkout, orders, reviews**
- Cart: store plate, lines, unavailable items as rows with Remove, vendor-lock dialog, minimum-order note, closed-store block, skeleton.
- Checkout: Details and Review progress header, item lines in the summary, inline payment frame (owner decision), delivery-not-available banner with Pick up instead, minimum-order banner, delivery time per area, closed-store banner. Closed stores block checkout (owner decision); placing the order fails with STORE_CLOSED.
- Order view: status header, summary, delivery or pickup card, stage timeline from real order states, Message seller, rate prompt, "Contact support" (owner decision).
- Order chat: conversation, day separators, Seen, counter, closed and rate-limit states, quick replies (customer-visible, owner decision).
- Reviews: summary, distribution, review cards with Read more and a Verified order mark, review sheet with edit window, shared `RatingInput` stars.
- Order summary: "Pickup, Free" row and the booking date and time (in the expert's time zone) for expert orders. Order view: cancel reason in the status header, seller photo on Message seller, chat open until line.

**Experts**
- Directory: search, category chips, language chips, count, empty and error states. Card: rating or New, verified mark.
- Profile: retry state, languages, credentials, years of experience, verified tier.
- `SlotPicker`: date strip, 3-column time grid, customer time zone, expert time zone beside it, "Book {time}" button.

**Account**
- More: Profile chip, language, Legal, in-app sign-out dialog. Profile: language row, email hint, in-app dialogs. Recipients: in-app delete dialog naming the recipient.
- Login and register: inline errors (shared `AuthNotice`) and a language chip in the top bar. PIN: inline error and red dots. Referrals: code on its own copyable row and a progress strip to the next level. Activity: skeleton, retry, saved-data note, Bookings filter.

**Backend, seller portal, data (needs `supabase/deploy/storefront-details.sql` run first)**
- Migration and deploy file: opening hours and time zone, minimum order, delivery time per area, store cover, verification tier, expert languages, time zone, credentials, years, verified flag. Additive, backfills from merchants, applies cleanly on a test Postgres.
- API: vendor and expert payloads, cart vendor, quote with minimum order and closed state, seller fulfilment route. New columns fall back cleanly on a database without the SQL.
- Seller portal: weekly hours with time zone, minimum order and delivery time on Delivery and pickup, in six languages.
- Tests: 111 merchant, 47 database, 11 marketplace pass.

## Left: can be built now (no backend)

1. Orders: a Delivery or Pickup chip on Activity rows (needs the fulfilment mode in the transactions list); sticky Message seller bar while an order is live.
2. ExpertBooking: step bar (Time, Details, Review) across the booking and checkout screens.
3. Search: match highlighting inside product and store names, "Try instead" chips.
4. Food and Mart home: move categories above Stores. Offline banner needs a network-status package (none installed; adding one is a dependency decision).
5. Favourites: stores as rows, offline read-only list.
6. Checkout: Review as its own step (today Details and Review share a screen).
7. Transfer detail: Share receipt (when a receipt exists), Repeat transfer with the same recipient and amount (needs a Send change).
8. FulfilmentPicker: delivery fee and time on each option.
9. Top bar on the remaining screens: orders list, order view and chat (these still use native headers).

## Left: blocked on backend or a decision

- Store paused or unavailable status in the public payload; delivery fee and minimum per area (minimum is per store today).
- Expert next availability and from-price on cards; credentials editor in the seller portal (read-only in the customer app today).
- Per-stage order timestamps (Preparing and Ready show as one stage); seller rating on the order; chat response-time line.
- Verification check date and checklist for the tooltip.
- Account deletion; KYC levels, limits and the Limits screen; support requests and chat; push registration and in-app notifications; PDF receipts.
- Popular near you; translation hint with Show original.
- PIN attempts-left and lock rules (needs a rule decision).

## Web app (`web/`): not audited

The Next app has its own copies of checkout, order view, timeline, cart bar and catalog. None of the work above is mirrored there. Next step is an audit like the one done for `mobile/`, then porting the shared pieces (hours and closed state, minimum order, expert fields, timeline, status header).

## Owner actions

1. Back up, then run `supabase/deploy/storefront-details.sql` after `seller-portal-all.sql` (order in `supabase/deploy/RUN-ORDER.md`). Until then the app shows no hours and the new seller fields fail to save.
2. Run the earlier files in `RUN-ORDER.md` if not done: `seller-portal-all.sql`, `rate-limits.sql`, `office-queues.sql`, `seller-screens.sql`.
3. Confirm tab labels (Home, Orders, Account), the hero copy, and the inline payment frame.

## Decisions made so far (also in `design-system/guides/80-decisions.md`)

Payment frame inline; support link stays "Contact support"; chat quick replies customer-visible; closed stores block checkout; minimum order applies to delivery only and in one currency; stores with no hours are never closed.

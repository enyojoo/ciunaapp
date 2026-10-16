# Design reconciliation: customer (Expo native and Expo web)

Rule: the shipped product wins over a weaker card (`design-system/guides/80-decisions.md`). Entries below are where the current app is better than, or deliberately differs from, a card. Update the cards from this log.

## Search (`SearchResults`)
- Entry: Home keeps the existing hero and tile grid; the search field is a tappable pill under the header (same paper/white surface as the header). Food, Mart and Experts use the existing translucent round chip in the orange hero (same as the back and cart chips) instead of a field, so the hero keeps its height. Card draws a full field in every header: keep the chip on phones.
- Results use the existing `ProductCard`, `StoreGridCard` and `ExpertDirectoryCard` (two-column grid, Add to cart and stepper still work in results). The card's 56px result rows are not used; the app's cards are richer (image, price, cart action).
- Not built from the card: match highlighting in bold, "Popular near you" chips (no data source), suggestion rows while typing, cached-only offline banner. "Try instead" chips show Search everywhere (when scoped) and the user's recent searches.
- Search is scoped by the entry point (`?line=food|mart|experts`) and can widen to everything.

## Favourites (`Favourites`, `FavouriteHeart`)
- Heart sits in the top corner of the image on product cards, store faces and expert cards (white round chip, filled orange = saved, outline = not saved). On the store and expert pages it is in the native header, next to the cart.
- Stores and experts are shown as the app's two-column image cards, not the card's list rows; products reuse `ProductCard`. Segmented tabs and the Undo toast follow the card.
- Hearts are hidden entirely when the favourites table is not applied on the database (no dead control).

## Order chat (`OrderChat`)
- The seller entry is a "Message seller" row on the existing order screen (same card style as the order summary), with an orange dot for unread. The order screen keeps the app's flat summary; the card's OrderTracking restyle is not part of this work.
- Chat uses the native header for back and seller name, a slim order strip, grey and orange bubbles, day separators, "Seen", counter and Enter-to-send on web. Not built: quick-reply chips, response-time line, info button, desktop side panel, "Report a problem" and "Complete payment" buttons inside the banners.
- Closed banner shows the closing date when the order payload carries it (`chat.closesAt`).

## Reviews (`ReviewFlow`, `ReviewCard`, `ReviewSummary`, `RatingStars`)
- "Rate your order" is an inline card on the completed order screen that opens a bottom sheet (centred dialog on desktop web) via the existing `WebAwareModal`. The card then shows the customer's own stars and Edit (within 48 h) or View (locked).
- Store and expert pages show a rating line under the name (stars, average, count) and a Reviews section below the content with distribution bars, three reviews and Show more. The card's separate Reviews tab is not used: the page is short enough to scroll.
- Not built: "Rate your session" copy variant for expert bookings (the same sheet is used); the order screen shows the prompt on any fulfilled order.

## Data and API (additive, graceful)
- All new endpoints were already present; changes in `api/app/api/hub/**` only make them degrade when tables or columns are missing on the live database (see `api-and-data.md`): search retries without `translations`; favourites, messages, unread, review and public review routes return empty/`unavailable` instead of 500; the order payload gains optional `seller` and `chat`.
- No new SQL is required for these screens, so there is no `20261017140000_customer_screens.sql`.

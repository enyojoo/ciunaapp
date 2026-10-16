# SellerFulfilment

## Purpose
Tell Ciuna where customers collect orders and where you deliver. Pickup details unlock Pickup products; an active delivery zone unlocks Delivery products.

## Anatomy
- Back to catalog, title "Delivery and pickup" and a one-paragraph intro.
- Missing-setup banners (pickup address, delivery zone) when something is not set.
- Pickup card: pickup address, opening hours (with an example), notes for customers.
- Delivery zones: one row per zone with city, district, delivery fee, currency, an Active switch and Remove; Add zone below.
- "What this unlocks": Pickup address, an active delivery zone, and digital products (need neither).
- Sticky save bar: unsaved-changes message, Save changes (disabled until something changes).

## States
Saved; unsaved changes; duplicate zone (error under the row: "Each city and district can be listed only once."); empty (banners and "No delivery zones yet."); inactive zone; saving; error banner from the server.

## Rules
- Each city and district pair appears once. Fee is 0 or more. Currency defaults to the store currency.
- Inactive zones are kept but customers cannot order there.
- Never lose work: unsaved changes warn on leave.

## Upgrade
Built in `seller/app/(shell)/catalog/fulfillment/page.tsx` (fields, validation, save bar). New in this design: the single-row zone layout on desktop (built stacks each zone in a bordered 2 by 2 card), the "What this unlocks" panel, and the missing-setup banners on this page (today they appear only in the product editor).

## Code
`seller/app/(shell)/catalog/fulfillment/page.tsx`

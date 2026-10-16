# SellerServices

## Purpose
The expert's list of bookable services and the place to publish or hide each one.

## Anatomy
Page header with Add service. Desktop table (title and price basis, price, duration, delivery chip, open-slot count, publish switch). Phone cards with the same fields. Draft or In review labels, and a hint row when something blocks publishing.

## States
Live with open slots; Live with zero open slots (warning chip plus Set availability link); Draft needing meeting instructions (switch off with an inline hint); In review after a title or description change; empty (first-service prompt); loading skeleton on first load.

## Rules
Zero open slots is a warning, never an error: the service is still live. The switch carries its own label for screen readers ("Publish {title}"). Unpublishing a service with future bookings is refused with the count (see SellerServiceEditor). Prices show the basis (per session or per hour). Money through Amount.

## Upgrade
Built in `seller/app/(shell)/services/page.tsx`. Differs: the desktop table is new (built uses stacked cards at every width), and the In review label on the list is new (built shows it only in the editor).

## Code
`seller/app/(shell)/services/page.tsx`

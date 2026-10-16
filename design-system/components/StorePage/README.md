# StorePage

## Purpose
A seller's storefront. The merchant fills cover, logo, hours and delivery terms from Ciuna Seller; the customer decides whether to order here.

## Anatomy
Cover image with back, share and favourite; logo plate overlapping the cover; name with Verified badge; rating and review count; cuisine and city; open/closed badge with hours; delivery time, fee and minimum order. Category chips jump to sections; product rows (80px photo, name, two-line description, price, 44px add). Reviews preview (two cards) with See all; info plate (hours, address, delivery). Desktop: wide cover, three-column menu and a side column with hours, delivery and the latest review.

## States
Open; closed (muted cover, banner with opening time in MSK, clock in place of Add); on sale (struck-through price); paused (not listed; a direct link shows "This store isn't available"); loading uses cover and row skeletons; offline shows the cached menu with a banner.

## Rules
Verified is a success badge with an icon. Closed stores can be browsed but not added to. One store per cart. Descriptions are shown in the customer's language when the seller has translated them, otherwise the seller's language.

## Upgrade
Built so far: cover band (line art until stores upload covers), round logo with white ring and initial fallback, verified mark, location, product count, rating line when reviews exist. Still New: hours and open or closed badge, delivery fee and minimum order (need API fields), reviews preview with See all, category jump chips, desktop layout.

Differs from the built app: cover, logo, Verified badge, hours, rating, reviews preview and the info plate are New (today a title and a plain product list); favourite on the store is New; the closed state and desktop layout are New.

## Code
`mobile/app/(app)/hub/[slug]/v/*`, `web/components/hub/*`

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
Built in `mobile/app/(app)/hub/[slug]/v/[vendor].tsx` with `StoreHeader` (`mobile/components/store-header.tsx`): fixed slots (cover scaled to screen width, round logo overlapping it, one-line name with ellipsis, one-line location, one status line with rating and product count), so every store has the same header height. The open or closed state is a chip on the cover. Under it: minimum order for delivery, pickup location, hours and notes, reviews, skeleton. Top bar is the shared hub top bar. Not built: share, paused-store state (needs a status field in the public payload).

## Code
`mobile/app/(app)/hub/[slug]/v/*`, `web/components/hub/*`

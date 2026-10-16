# StoreCard

## Purpose
A store in the customer catalog, as a horizontal-rail card or a full-width list card.

## Anatomy
Cover (16:9 rail, 21:8 wide) with favourite heart and optional status chip; 48px logo overlapping the cover; name with verified icon; rating and count; location; delivery fee and ETA.

## States
default, favourite, closed (greyscale cover and logo, 'Closed · Opens 9:00' chip), unverified, long Russian name (two lines), skeleton. Paused and suspended stores are not listed.

## Rules
Closed stores stay visible and favouritable but cannot be added to. Text colours never drop below AA when closed; only imagery goes greyscale. The verified icon follows VerifiedBadge. Opening time uses the viewer's time zone.

## Upgrade
New; today only a plain vendor chip exists (`mobile/components/store-item.tsx`). Adds cover, logo, rating, closed state and the wide variant.

## Code
`mobile/components/store-item.tsx`, `web/components/hub/hub-marketplace-vendor-storefront.tsx`

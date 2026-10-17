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
Built in `mobile/components/store-item.tsx`: cover (the store's image when set, else the line's art), round logo, name with the verified mark (two tiers), rating or New store, location, favourite, and a dimmed cover with a Closed chip when the store has hours and is closed. Favourites lists use `StoreRow` (`list-rows.tsx`).

## Code
`mobile/components/store-item.tsx`, `web/components/hub/hub-marketplace-vendor-storefront.tsx`

## As built (2026-10-19)
The HTML preview shows the earlier layout. The running app is the reference: [food-home.png](../../reference/current-app/shots/food-home.png) (captured from the Expo web build with demo data; `node scripts/capture-current-app.mjs food-home`).

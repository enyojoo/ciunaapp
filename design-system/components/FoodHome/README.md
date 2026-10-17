# FoodHome

## Purpose
The landing page of the Food service line: find a store or a dish and start a cart.

## Anatomy
Back header with cart icon, rounded search field, category chips (All plus cuisines), a "Stores" rail of StoreCards with See all, a "Featured" two-column grid of ProductCards, and a floating cart bar (item count, subtotal) above the tab bar. Desktop: same sections in four columns under the top nav.

## States
Loaded; first-load skeleton (rail and grid); empty line ("No stores yet" with a way back); offline with cached content under a neutral banner. Chips filter in place. The cart bar appears only when the cart has items.

## Rules
Search, chips and sort sit above the lists. Closed stores stay visible but muted. Paused stores are hidden. Prices show symbol first. One store per cart: adding from another store asks first (see Cart).

## Upgrade
Differs from the built app: search field, category chips and the Stores rail with ratings are New (today a plain vendor list and product grid); the floating cart bar and the offline banner are New; desktop four-column layout is New.

## Code
`mobile/app/(app)/hub/[slug]/index.tsx`, `web/components/hub/*`

## As built (2026-10-19)
The HTML preview shows the earlier layout. The running app is the reference: [food-home.png](../../reference/current-app/shots/food-home.png) (captured from the Expo web build with demo data; `node scripts/capture-current-app.mjs food-home`).

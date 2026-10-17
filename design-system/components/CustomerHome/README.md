# CustomerHome

## Purpose
The first screen of the customer app: a quiet launcher for the services Office has switched on.

## Anatomy
Header (sticky): Ciuna logo left, Refer pill (teal) and the profile avatar right (opens Account). Support and search are not on Home. Below the header: the hero banner (what Ciuna is for: a home for people abroad; height follows the screen, 128 to 176 px), then the service tiles. Home fits on one screen without scrolling. One muted line. A two-column grid of service tiles (4:3 artwork, title, one short line) from Office Hub Services. Three-tab bar on phones. On desktop web: top nav (Home, Orders, Favourites), greeting, four-column tiles and a referral plate.

## States
Loaded; first-load skeleton (six tiles) with no cache; a tile hidden by Office (grid reflows); Russian and Chinese copy (wrap, no truncation of titles); desktop. Empty (all tiles off) shows the standard EmptyState "Unavailable" with retry; offline shows cached tiles with no banner on Home.

## Rules
No orange billboard: paper canvas with white tiles. Tile order, copy and artwork come from Office, never hardcoded. Icon artwork is a placeholder here (`.ph`). Each tile is one 48px+ tap target. Refer is teal, never a status colour.

## Upgrade
Built in `mobile/app/(app)/hub/index.tsx`. Sticky header (logo, Refer, avatar), purpose slider, drawn service tiles, no search. The page fits every screen height with no scrolling: tiles share the space under the banner, artwork flexes, two description lines are always reserved so rows stay equal, and the banner compacts on short screens (checked from 320x568 to 430x932). On wide web screens the tiles sit in one row of four, height capped, and the banner fits the content column.

## Code
`mobile/app/(app)/hub/index.tsx`, `mobile/components/tile.tsx`, `web/components/hub/*`

## As built (2026-10-19)
The HTML preview shows the earlier layout. The running app is the reference: [home.png](../../reference/current-app/shots/home.png) (captured from the Expo web build with demo data; `node scripts/capture-current-app.mjs home`).

# CustomerHome

## Purpose
The first screen of the customer app: a quiet launcher for the services Office has switched on.

## Anatomy
Compact header: Ciuna logo left, Refer pill (teal) and Support pill right. One muted line. A two-column grid of service tiles (4:3 artwork, title, one short line) from Office Hub Services. Three-tab bar on phones. On desktop web: top nav (Home, Orders, Favourites), greeting, four-column tiles and a referral plate.

## States
Loaded; first-load skeleton (six tiles) with no cache; a tile hidden by Office (grid reflows); Russian and Chinese copy (wrap, no truncation of titles); desktop. Empty (all tiles off) shows the standard EmptyState "Unavailable" with retry; offline shows cached tiles with no banner on Home.

## Rules
No orange billboard: paper canvas with white tiles. Tile order, copy and artwork come from Office, never hardcoded. Icon artwork is a placeholder here (`.ph`). Each tile is one 48px+ tap target. Refer is teal, never a status colour.

## Upgrade
Differs from the built app: `HubHero` (gradient billboard) is replaced by the paper canvas and one muted line; the Refer pill and Support pill are in the header; desktop gets a greeting and referral plate (New). Tiles, skeleton and Office-driven grid are built.

## Code
`mobile/app/(app)/hub/index.tsx`, `mobile/components/tile.tsx`, `web/components/hub/*`

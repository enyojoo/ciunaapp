# MartHome

## Purpose
The entry to Mart, Ciuna's groceries and spices line: find a store or a product and fill one cart.

## Anatomy
Header with back, title and cart; pill search; category chips (All, African, Chinese, Latin, Halal, Spices); Stores rail (cover, verified badge, rating, cuisine, delivery time and minimum); Popular today grid (4:3 photo, name, store, price, 44px add button or stepper); floating cart bar with item count and total. Mart uses the same shell as Food (`hub/[slug]/index.tsx`); the line's title, chips and tile come from Office Hub Services.

## States
Loaded with cart; first load skeleton; filtered with results count; no results; closed store (opening time); out of stock; offline cached; no stores for the address; error with retry; Russian.

## Rules
One store per cart: adding from another store asks to replace the cart. Prices are in rubles, no `.00`; a struck-through price marks a sale. Chips and search combine. Skeleton only without cache. Out-of-stock products stay visible but cannot be added. The cart bar uses the primary orange with a white label and is the one orange control on screen besides add buttons.

## Upgrade
Differs from the built app: `mart.tsx` redirects to the generic hub line (`hub/[slug]`), which renders the shared catalog without search, chips or a Stores rail. This page is the Food layout applied to Mart: search, chips, rail, grid with steppers, closed and out-of-stock states and an offline line are New.

## Code
`mobile/app/mart.tsx`, `mobile/app/(app)/hub/[slug]/index.tsx`, `mobile/app/(app)/hub/[slug]/stores.tsx`

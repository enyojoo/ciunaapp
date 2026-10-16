# PriceTag

## Purpose
The one way a price is displayed in the customer app, from tiles to the detail page.

## Anatomy
Value (bold, tabular), optional muted prefix (From), optional muted suffix (/ hour, unit price), optional strike-through original, optional percent badge.

## States
list, sale, from, per hour, unit price, quote, free, sold out (muted), long sale (wraps). Sizes sm 15, md 18, lg 28.

## Rules
Goes through `formatMoney` / `Amount`. Symbol first, no `.00` in lists, cents kept in breakdowns. Customers see only the pay currency, no FX chrome. Sale price keeps ink colour; the saving is a success badge, never orange or red. Quote and free are words, never ₽0.

## Upgrade
Extracts the inline price markup in `mobile/components/product-card.tsx` and the web vendor storefront into one component. Adds unit price and quote.

## Code
`packages/shared/src/money` (formatMoney), `web/components/ui/amount.tsx`

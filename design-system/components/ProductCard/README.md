# ProductCard

## Purpose
A purchasable item in grids, rails and search results.

## Anatomy
Grid: 4:3 photo (favourite heart top right, sale or sold-out badge on the photo), name (2 lines), vendor chip, price, one Add button that becomes a stepper. List row: 88px square photo, name, vendor chip, price; heart and Add or stepper on the right.

## States
default, sale, low stock (warning text with icon), in cart (stepper, primary-border), sold out (desaturated, disabled Add), store closed, long Russian and Chinese titles, skeleton.

## Rules
One action per card. Price follows PriceTag. Orange appears only on the Add button. Heart on a white plate. Tap targets 48px (visual 40px with padded hit area). Sold out stays visible. The skeleton shows only on a true first load.

## Upgrade
Extends `mobile/components/product-card.tsx` and the web storefront tile: adds the in-cart stepper, low-stock line, closed-store state, list row variant, Chinese and Russian clamping.

## Code
`mobile/components/product-card.tsx`, `web/components/hub/hub-marketplace-vendor-storefront.tsx`

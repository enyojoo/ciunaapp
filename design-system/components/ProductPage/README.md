# ProductPage

## Purpose
Everything needed to decide on one item and add it to the cart without leaving the page.

## Anatomy
Square gallery with dots, back and favourite; title; price with optional struck-through old price; stock badge; vendor row (logo, name, verified, rating, opens the store); fulfilment choice as two radio cards (Delivery with time and fee, Pickup with address and ready time); translation hint when the seller provided a translation in the viewer's language; description; reviews teaser with See all; sticky bar with quantity stepper and **Add to cart · price**.

## States
Default; sold out (Sold out badge, fulfilment dimmed, the add button replaced by a disabled Sold out); low stock ("Only 3 left" warning under 5); "12 left" neutral above; long text (title wraps, description grows, page scrolls); loading shows a square skeleton and text bars; translation hint with Show original.

## Rules
Stock is a word and an icon, never colour alone. Buttons name the action and the total. Adding from a different store than the cart asks first (see Cart). Fulfilment options come from the seller; unavailable ones are hidden, not disabled, unless the product is sold out.

## Upgrade
Built in `mobile/app/(app)/hub/[slug]/p/[productId].tsx`: shared top bar with favourite and cart, swipeable gallery with dots (`product-gallery.tsx`, from the merchant gallery), title, fulfilment and time chips, store chip, description, `PriceTag`, stock line (Only N left under 6), Add to cart or stepper, More from this store, skeleton, vendor-lock dialog. Not built: sticky bottom bar, reviews teaser (no product reviews yet).

## Code
`mobile/app/(app)/hub/[slug]/p/*`, `web/components/hub/*`

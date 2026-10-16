# Current ProductCard (Expo), extracted from `mobile/components/product-card.tsx`

Baseline for task D0. Rebuild `components/ProductCard/preview.html` with a "Current" frame that matches this exactly, then an "Improved" frame.

## Structure (grid card)
1. Card shell: `overflow hidden`, radius 16 (`radius.card`), 1px border `#E5E7EB`, background `surface`, shadow `{opacity .08, radius 10, offsetY 4, elevation 2}` (colour `#0F172A`).
2. Image area: full width, aspect 4:3, background `#F3F4F6`, image `contain` (not cover). No image: centred 11px muted text "No image". Optional category badge top-right: white 92% pill, 9px/600 text `#374151`, padding 6x2, offset 6.
3. Title block (padding 10 x, 8 top): title 13px/600, line-height 17, 1 line, ink. Fulfilment cue under it when delivery or pickup: 11px/600, primary colour, capitalised, 2px above.
4. Body (padding 10 x, 0 top, 10 bottom):
   - Vendor chip (6px above): 18px round photo or initial fallback (9px/700 muted on paper), name 11px/500 ink, verified check 12px primary. Tap opens the vendor.
   - Price block (10px above, gap 8): price row baseline, gap 4, wrap: prefix 11px/500 muted ("Sell price", "Pay from", "Set amount"), strike 11px muted line-through, price 15px/700 ink.
   - Action: min height 32, radius 12.
     - Add: primary fill, label 12px/600 white, cart icon 13px, gap 5, text "Add to cart". Sold out: same button at 50% opacity, text "Sold out".
     - In cart: stepper, min height 32, radius 12, 1px primary border, background `#FFF7ED`, padding 6; minus and plus 24px hit with 14px icons (stroke 2.4, primary), count 13px/700 primary centred.
     - Non-cart lines: same primary button with the CTA label (opens the product page).
5. Card tap (image, title) opens the product page; never a direct checkout.
6. Width: `48.5%` of the grid (2 columns on phones; more on wide screens via `useCatalogGridColumns`); in rails a fixed pixel width.
7. Skeleton: same shell, 4:3 `#F3F4F6` block, title bar 14px high 80% wide, meta bar 10px high 50% wide, radius 4, no shadow, border `hairline`.

## Tokens used
`colors.primary` (`#CD4B0E`), `onPrimary` white, `text` ink, `muted`, `paper`, `surface`, `border` hairline; `radius.card` 16, `radius.pill` 999. Raw values not yet in tokens: `#E5E7EB` card border, `#F3F4F6` image well, `#FFF7ED` stepper tint (use `--primary-tint`), `#374151` badge text.

## Improvement candidates (decide with screenshots)
- Image `contain` leaves grey bars on non-4:3 photos: consider `cover` with a safe crop.
- Title 1 line truncates long Russian and Chinese names: allow 2 lines.
- "Sell price" prefix on every card is noise: show it only for "Pay from" or "Set amount".
- Price and Add button stack vertically (card height grows): consider price left, round add button right.
- Favourite heart and rating are absent; add them as per `FavouriteHeart` and `RatingStars`.
- Sold-out state is only a dimmed button: dim the image and add a "Sold out" label.

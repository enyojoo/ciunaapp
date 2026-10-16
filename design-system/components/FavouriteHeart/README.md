# FavouriteHeart

## Purpose
One-tap save of a product, store or expert to the customer's favourites.

## Anatomy
34px white circle with a heart; 48px hit area; on-state fills the heart in primary-text.

## States
off, on, pressed, focus, disabled (request in flight), sign-in needed. Placed on a card corner or in a page header.

## Rules
Toggle with aria-pressed; label names the next action ('Save to favourites' / 'Remove from favourites'). Optimistic update with rollback. Signed-out taps open a sign-in sheet and never toggle. Always on a white plate so it reads over any photo.

## Upgrade
Built in `mobile/components/favourite-heart.tsx`: 34px plate with a 48px tap target on cards; a plain 40px icon inside list rows and the top bar; optimistic with rollback; hidden when favourites are unavailable.

## Code
`web/components/hub/favourite-button.tsx`, `mobile/components/favourite-button.tsx`

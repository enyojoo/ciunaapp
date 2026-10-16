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
Extends the `.heart` markup used on tiles; the pressed state and sign-in sheet are new.

## Code
`web/components/hub/favourite-button.tsx`, `mobile/components/favourite-button.tsx`

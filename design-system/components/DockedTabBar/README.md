# DockedTabBar

## Purpose
The bottom navigation of the customer app (Home, Activities, Account), docked to the bottom edge, with the cart dot used in line headers.

## Anatomy
A full-width bar fixed to the bottom edge with a hairline on top, no floating margin and no shadow. Three tabs: icon 24 and label 12 below it, content 56 high plus the safe area. The active tab uses the primary colour, others muted. In line headers the cart action is 44 and an orange dot (8) on its corner shows that the cart has items; the count is in the screen-reader label, not on screen.

## States
tab default, tab active, cart empty, cart with items (dot), tab bar hidden on screens that own the bottom (Food, Mart, store, product, cart, checkout).

## Rules
- The bar shows only on the three tab roots. Screens with their own bottom action hide it.
- Docked, never floating: it sits on the screen edge and the home indicator area is part of the bar.
- The cart shows a dot, never a number badge. The label reads "View cart (3)" for screen readers.
- Tab targets are at least 48 high and wide.

## Upgrade
Replaces the floating pill bar and the numeric cart badge.

## Code
`mobile/app/(app)/_layout.tsx`, `mobile/lib/tab-bar-layout.ts`, `mobile/components/hub-cart-header-button.tsx`

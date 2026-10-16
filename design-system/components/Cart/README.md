# Cart

## Purpose
Review one store's order before checkout.

## Anatomy
Back header; store plate (logo, name, delivery time, Add more); lines (photo, name, option, stepper, line total); summary plate (subtotal, delivery, total); sticky **Checkout · total** button. Steppers are 44px; minus at one removes after a confirmation swipe-undo toast.

## States
Filled; below minimum order (warning banner, Checkout disabled); vendor lock sheet when adding from another store (Start new cart / Keep current cart); empty cart with a way to Food; loading skeleton lines; item became unavailable (line muted with Remove, Checkout disabled until removed).

## Rules
One store per cart. Money format: symbol first, no cents on whole amounts in lists, cents kept in breakdowns. The warning names the missing amount. The vendor-lock sheet never clears the cart silently.

## Upgrade
Differs from the built app: the minimum-order warning, the vendor-lock sheet wording with two actions, and the store plate with Add more are New or reworded; lines and stepper exist today.

## Code
`mobile/app/(app)/hub/[slug]/cart.tsx`

# CartLine

## Purpose
One item in the customer's cart, with a quantity stepper, the line price and clear handling of problems.

## Anatomy
80px photo, name, option note, optional problem tag, pill stepper (44px, bin at quantity 1) and the line price at the right. The vendor-lock notice is a separate warning card with Start new cart and Keep current cart.

## States
Default, quantity 1 (bin), long name (wraps), sold out (muted, Remove button), price changed (warning tag), low stock (plus disabled), another-store notice.

## Rules
One store per cart; switching stores needs confirmation. Prices are in the pay currency, whole rubles. Problems pair an icon with words. Tap targets are 44px or more; the primary button is 52px. Customer font.

## Upgrade
Matches the Cart card's rows; new are the problem states and the stand-alone notice.

## Code
`mobile/components/marketplace-checkout.tsx` and the cart screen

# OrderSummary

## Purpose
The final check before paying: what is being bought, what delivery costs, the single total and how to pay.

## Anatomy
Heading and store line, a plate of item lines, delivery line and bold total, a "Pay with" list of methods as radio rows, and a large Pay button carrying the total.

## States
Delivery order, pickup (delivery shown as "Pickup, free"), expert booking (service, date and time instead of items), each with a different method selected.

## Rules
The total is in the pay currency, whole rubles with true minus rules elsewhere. No FX chrome and no provider names (methods are Bank card, SBP). Methods are 56px radio rows. Customer font.

## Upgrade
Matches the totals block in `mobile/components/marketplace-checkout.tsx`; new is the stand-alone method list with the amount on the button.

## Code
`mobile/components/marketplace-checkout.tsx`

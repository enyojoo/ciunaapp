# OrderSummary

## Purpose
The final check before paying: what is being bought, what delivery costs and the single total.

## Anatomy
Heading and store line, a plate of item lines, delivery line and bold total, and a large Pay button carrying the total. There is no method list; Pay opens the provider's payment frame.

## States
Delivery order, pickup (delivery shown as "Pickup, free"), expert booking (service, date and time instead of items), each ending in the Pay button. After payment, one line shows the method name returned ("Bank card ····4242", "SBP").

## Rules
The total is in the pay currency, whole rubles with true minus rules elsewhere. No FX chrome and no provider names in our copy. We do not draw payment methods; the method appears only after payment, as returned. Customer font.

## Upgrade
Matches the totals block in `mobile/components/marketplace-checkout.tsx`; differs from the earlier design (method radio list removed): methods are chosen in the provider's payment frame.

## Code
`mobile/components/marketplace-checkout.tsx`

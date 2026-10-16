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
Built as `SummaryCard` in `mobile/components/marketplace-checkout.tsx`: store, order number, item lines, service fee, Delivery fee or Pickup Free, total, payment state, and the booking date and time (in the expert's zone) for expert orders.

## Code
`mobile/components/marketplace-checkout.tsx`

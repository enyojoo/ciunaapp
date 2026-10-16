# MarketCheckout

## Purpose
Pay one store for one order. A merchant checkout, not Send's FX wizard.

## Anatomy
Header with three-segment progress (Details, Payment, Review). Details: contact (name, phone), Delivery or Pickup segmented control, address fields with delivery-zone plate and fee, or pickup info. Payment: methods for the pay currency, as radio cards. Review: order summary (lines, subtotal, zone fee, total), contact and address recap. Sticky primary button names the action and carries the total on the last step. After paying online: a pending screen.

## States
Delivery; pickup; address required (inline error); zone not served (destructive banner, Continue disabled, options to change address or pick up); pay online opening (busy button); payment pending ("Checking payment. Please don't pay again." with a pending badge and View order); payment failed returns to Review with an error banner and the same order.

## Rules
Methods for RUB: bank transfer, SBP QR, pay online. Never name providers. No FX rate, fee or delivery-time chrome from Send. Total is in the pay currency everywhere. One tap on Place order, then the button is busy; never allow a second payment while pending.

## Upgrade
Differs from the built app: today `marketplace-checkout.tsx` is a single form; the three-step layout with progress, the pickup variant, the zone-not-served banner and the pending screen are New or reworded. Method list per currency exists today.

## Code
`mobile/components/marketplace-checkout.tsx`, `mobile/app/(app)/hub/[slug]/checkout/*`

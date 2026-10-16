# MarketCheckout

## Purpose
Pay one store for one order. A merchant checkout, not Send's FX wizard.

## Anatomy
Header with two-segment progress (Details, Review). Details: contact (name, phone), Delivery or Pickup segmented control, address fields with delivery-zone plate and fee, or pickup info. Review: order summary (lines, subtotal, zone fee, total), contact and address recap, one sticky primary button "Pay ₽X". Pay opens the provider's payment frame (web: embedded widget; native: the provider SDK), then a result screen.

## States
Delivery; pickup; address required (inline error); zone not served (destructive banner, Continue disabled, options to change address or pick up); payment frame opening (busy button); frame open (neutral placeholder panel labelled as the provider's secure payment frame); waiting for confirmation ("Checking payment. Please don't pay again.", pending badge, View order); paid (method name returned, for example "Bank card ····4242"); failed (error banner on Review, "Try again"); frame closed or cancelled (neutral banner, same order, Pay ready again).

## Rules
No pay-method list: methods (card, SBP, others) appear inside the provider's payment frame, which we neither draw nor recreate (the card shows a plain placeholder, no provider logo or UI). Our own copy does not name the provider. The method is shown only afterwards, as the name returned. No FX rate, fee or delivery-time chrome from Send. Total is in RUB everywhere. One tap on Pay, then the button is busy; never allow a second payment while checking.

## Upgrade
Differs from the earlier design (which drew a method list; removed) and follows built behaviour: `marketplace-checkout.tsx` uses an embedded gateway on web and a native SDK gateway on mobile, driven by payment attempts. The two-step layout with progress, the pickup variant, the zone-not-served banner and the frame result screens are New or reworded.

## Code
`mobile/components/marketplace-checkout.tsx`, `mobile/app/(app)/hub/[slug]/checkout/*`

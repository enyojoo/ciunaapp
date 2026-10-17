# MarketCheckout

## Purpose
Pay one store for one order. A merchant checkout, not Send's FX wizard.

## Anatomy
Header with two-segment progress (Details, Review). Details: contact (name, phone), Delivery or Pickup segmented control, address fields with delivery-zone plate and fee, or pickup info. Review: order summary (lines, subtotal, zone fee, total), contact and address recap, one sticky primary button "Pay ₽X". Pay opens the provider's payment frame (web: embedded widget; native: the provider SDK), then a result screen.

## States
Delivery; pickup; address required (inline error); zone not served (destructive banner, Continue disabled, options to change address or pick up); opening (a screen with a spinner and "Opening secure payment…"); frame open (inline on the same checkout screen, below the order summary and details; a neutral placeholder labelled "Secure payment frame"); waiting for confirmation ("Checking payment. Please don't pay again.", pending badge, View order); paid (method name returned, for example "Bank card ····4242"); failed (error banner on Review, "Try again"); frame closed or cancelled (neutral banner, same order, Pay ready again).

## Rules
No pay-method list: methods (card, SBP, others) appear inside the provider's payment frame, which we neither draw nor recreate (the card shows a plain placeholder, no provider logo or UI). Our own copy does not name the provider. The method is shown only afterwards, as the name returned. No FX rate, fee or delivery-time chrome from Send. Total is in RUB everywhere. The payment frame is inline below the order summary, not a separate screen or sheet (see 80-decisions). One tap on Pay, then the button is busy; never allow a second payment while checking.

## Upgrade
Built in `mobile/components/marketplace-checkout.tsx`: two real steps with a step bar (Details, Review; bookings add Time). Details has the form and Continue to review; Review has a recap of your details with Edit and the payment. Payment frame is inline (owner decision). Banners: delivery not available (with Pick up instead), minimum order, store closed (checkout blocked). Delivery and pickup options show fee, time and hours. Narrow centred column on wide screens.

## Code
`mobile/components/marketplace-checkout.tsx`, `mobile/app/(app)/hub/[slug]/checkout/*`

## As built (2026-10-19)
The HTML preview shows the earlier layout. The running app is the reference: [checkout-page.png](../../reference/current-app/shots/checkout-page.png), [cart-filled.png](../../reference/current-app/shots/cart-filled.png) (captured from the Expo web build with demo data; `node scripts/capture-current-app.mjs checkout-page cart-filled`).

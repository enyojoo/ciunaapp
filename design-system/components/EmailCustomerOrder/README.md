# EmailCustomerOrder

## Purpose
The emails a customer gets as an order or booking moves, so they never have to open the app to learn what happened.

## Anatomy
EmailLayout frame. Title names the state, one sentence says what happens next (and when), an optional label/value block for money or session details, one button, footer. Money in breakdown format; times with the zone name.

## States
Order received (awaiting payment, button "Pay ₽1,250"), payment received, order accepted, order ready, completed ("Rate your order"), cancelled (refund note with timing, no provider name), booking confirmed (customer's time and the expert's, "Join meeting").

## Rules
- One button per email. The pay button carries the amount.
- Bookings always show the customer's time zone first, the expert's second.
- A cancellation says whether money is coming back, how much and by when.
- "Rate your order" appears only on completed orders, never on cancelled.
- No provider names, no emoji, no exclamation marks.

## Upgrade
New. Today customers get app and push updates only; `api/lib/email-templates.ts` has remittance (send) emails and hub order emails (pending, processing, completed) on the older frame, not the marketplace states. Needs six-language copy next to the seller alert strings.

## Code
`api/lib/email-templates.ts` (to be extended)

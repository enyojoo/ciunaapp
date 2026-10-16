# EmailSellerAlerts

## Purpose
Short emails that tell a seller one thing happened and give them the one action. They back up the Telegram alert and the push for sellers who read mail first.

## Anatomy
EmailLayout frame. Title (the event), one sentence (amount and item, or the reason), one button "Open in Ciuna Seller" that deep-links to the order, booking, thread, payouts or setup page. Footer: "You get this because you work on {store}. Change alerts in Settings."

## States
New order, new booking request, new message, payout approved, payout paid, payout rejected, application approved, rejected, suspended. Same events in en, ru, fr, es, zh and pt; the card shows Russian, French and Chinese for the new order email.

## Rules
- Amounts use breakdown format with cents (`₽1,250.00`).
- Booking times show UTC today; the design asks for the seller's own zone with the zone name (see Upgrade).
- Rejected and suspended emails always say why and what to do next.
- English is the fallback for any missing string. The button is always "Open in Ciuna Seller", translated.
- No provider names; a payout reference is ours (PAY-20412).

## Upgrade
Built today: all copy and the HTML in `api/lib/merchant/notify-messages.ts` (six languages, one button, footer), with a plain-text part. Differs: the shipped HTML has no logo or support line, uses a system font stack, and booking times are shown as "2026-10-21 12:00 UTC". New: logo in the frame, seller-zone times ("3:00 PM WAT"), and a support line on rejected and suspended alerts.

## Code
`api/lib/merchant/notify-messages.ts`

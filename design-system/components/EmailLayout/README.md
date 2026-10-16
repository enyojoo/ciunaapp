# EmailLayout

## Purpose
The one frame every Ciuna email uses, so a payout alert, a receipt and a booking link all look like they come from the same place.

## Anatomy
Paper page, white rounded plate, max width 480px (600px on desktop mail clients). Logo top-left (22px), title (20px, bold, ink), one body paragraph (16px, muted), optional label/value block, one button, footer. Footer: a "You get this because..." line, the support address `support@ciuna.com`, then the company line. Every email also ships a plain-text part with the same words and the link on its own line.

## States
- HTML and plain text, shown side by side in the card.
- With label/value block (receipts, bookings): see EmailCustomerOrder.
- Localised: all footer and button copy comes from the user's language; layout survives 40% longer text (see EmailSellerAlerts).

## Rules
- Light only; `ink` on white, `muted` for secondary text.
- One orange button, white label, names the action ("View order", never "Click here"). The colour is `primary` (#CD4B0E), not the logo orange.
- Inline styles only in the shipped HTML (mail clients), values copied from tokens.
- No provider names, no emoji, no exclamation marks on money or status.
- The "You get this because..." line says why, in one sentence.

## Upgrade
Partly built. `api/lib/merchant/notify-messages.ts` renders the seller alert frame (title, sentence, button, footer) with no logo and no support line. `api/lib/email-generator.ts` (`generateBaseEmailTemplate`) is the older customer frame with its own header styling. New: one shared frame with the logo, support address and company line for both, and a plain-text part built from the same fields.

## Code
`api/lib/email-generator.ts`, `api/lib/merchant/notify-messages.ts`

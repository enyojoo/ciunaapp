# RateLine

## Purpose
How the exchange rate and the quote under it are shown, including what happens when a rate is held, runs out or goes out of date.

## Anatomy
Compact line: rate with a symbol on each side (`₽1 = ₦16.80`) and a status on the right. Expanded quote plate: Exchange rate row, status row, You send, Processing fee with its percentage, Recipient gets in bold, Total to pay under an ink rule. Statuses: live marker, lock icon with a mm:ss countdown, expired badge, stale warning, Updating spinner. A one-sentence notice names a rate change.

## States
Live; locked (countdown); locked, last minute (warning pair at 60 seconds); expired (struck-through figures, Get new rate); stale (warning, Refresh); refreshing (old value stays); unavailable (Try again); rate changed (old rate and the effect on the amount that was not edited); expanded live, locked, expired, stale; three-line summary.

## Rules
Rates use symbols on both sides; one or more shows two decimals, under one shows two or three significant digits. The rate is held from Continue to the end of the payment window (10 minutes in this example, set in Office). The countdown is always text, never colour alone. An expired quote disables Pay and offers one action. Stale means no update for a set time (15 minutes in this example, set in Office). Never name the rate source or any provider. Fees are named; the total is bold.

## Upgrade
Differs from the built app (`send-quote-notice.tsx`, quote preview in `send.tsx`): the live rate, named fee and total are built; rate lock with a countdown, the expired and stale states, Refresh and the rate-changed sentence are New and need a quote expiry from the API.

## Code
`mobile/components/send/send-quote-notice.tsx`, `mobile/app/send.tsx`

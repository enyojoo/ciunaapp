# PushAndInApp

## Purpose
How an event reaches someone who is not looking at the app (push) and someone who is (toast and badge). Same words as the emails, shorter delivery.

## Anatomy
Push: app name, time, title (the event), one-sentence body. Android may add one action button. In-app toast: bell icon, title, one line, ink background, white text, top of the screen. Badge: orange count on the bottom-nav icon, 18px, white number.

## States
- iOS lock screen with three seller alerts (new order, message, payout sent).
- Android shade with customer updates (ready with "Track order", accepted, cancelled with refund note, booking reminder with "Join meeting").
- In-app: toast over the Orders list while a new order arrives, with badges on Orders (3) and Messages (1).

## Rules
- Tapping always deep-links to the exact order, booking or thread.
- Seller alerts and customer updates use the notification copy of the matching email; no emoji, no exclamation marks, no provider names.
- Toasts do not stack: a new one replaces the last. Errors use the destructive toast variant.
- Badges are counts of required actions, not of everything unread.
- Respect the user's notification settings and quiet hours; seller new-order alerts can bypass quiet hours only if the seller chose that.

## Upgrade
Built today: seller push alert copy is generated with the email copy (`api/lib/merchant/notify-messages.ts`). New: customer order and booking push with actions, the in-app toast on Seller and the app, and nav badges with counts.

## Code
`api/lib/merchant/notify-messages.ts`, Seller shell, customer app tab bar

## As built (2026-10-19)
Order, chat, support, transfer, booking-reminder and expert-times pushes with per-category switches; quiet hours in the customer's time zone; a Reply button on chat notifications (typed on the lock screen, sent without opening the app); tapping opens the right screen; unread badges on the Orders and Account tabs; foreground pushes appear as the in-app ink toast. Not built: more action buttons (for example Join).

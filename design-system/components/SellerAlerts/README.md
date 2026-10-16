# SellerAlerts

## Purpose
Choose where order and booking alerts go and which kinds to mute.

## Anatomy
Where to send alerts (Email switch, Telegram row), Telegram connect banner, What to alert (per-kind switches). Stores see New orders; experts see New booking requests.

## States
Telegram not linked; waiting for Start; linked as @username with Disconnect; unavailable banner.

## Rules
Switches take effect at once. Telegram stays off until linked. The unavailable banner says email still works.

## Upgrade
Built in seller/app/(shell)/settings/notifications/page.tsx. Differs: the Waiting button state and its reassurance line are proposals.

## Code
seller/app/(shell)/settings/notifications/page.tsx

# SellerOrders

## Purpose
The seller's orders list on a phone: what needs action now, with one tap to accept.

## Anatomy
Top bar (store switcher, menu), title and one-line help, segmented tabs with counts (New, In progress, Completed, Cancelled), order cards (number, relative time, status badge, items summary, fulfilment chip, due timer, total, one primary action), bottom navigation.

## States
New orders; overdue (timer turns destructive); empty ("No new orders" with a way to set up alerts); loading (skeleton cards on first load only); error with retry.

## Rules
One next action per card. Reject lives in the detail screen. The timer and status always carry words, never colour alone. Money through Amount.

## Upgrade
Built in `seller/app/(shell)/orders/page.tsx`. This card is the reference for spacing and the card anatomy.

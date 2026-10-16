# OrderCard

## Purpose
A seller's order or booking in a list (phone) or a board column (desktop). It answers "what is it, how much, how long do I have, what do I tap".

## Anatomy
Order number (opens the detail), customer and age, status badge, items summary, fulfilment chip, due timer, total (`Amount`, large), and one primary action. Bookings replace the items line with the service, the slot in the seller's time zone and the customer's.

## States
- New: amber badge, due timer running, **Accept order** (Accept booking for bookings).
- New, under 5 minutes: timer turns warning; over time: destructive text "Overdue by 6 min".
- Accepted: green badge, **Start preparing**.
- Preparing and Ready: no button on the card, "View order" link (marking fulfilled needs a note, so it is in the detail).
- Completed, Rejected, Cancelled: muted card on paper, no timer, no button; a rejected card shows the reason.
- Variants by fulfilment: delivery, pickup, digital, online booking, in-person booking.
- Desktop board: columns New, Accepted, Preparing, Ready with counts; compact card (12px padding, small button).

## Rules
One next action per card. Reject lives in the detail. The timer shows only for live orders. Buttons name the action, never "OK". The card never shows card-brand or provider names.

## Upgrade
Built today: new, accepted, preparing, completed with accept and start. New: warning state under 5 minutes, booking slot lines, rejected reason on the card, the desktop board column layout.

## Code
`seller/components/orders/order-card.tsx`

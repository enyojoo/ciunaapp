# OrderTracking

## Purpose
The customer's single view of a marketplace order from placement to completion: where it is, what is in it, how it gets to them, who to talk to and what was charged.

## Anatomy
- Top bar with back, order number and "store · placed" line.
- Status header: one icon, one status badge (StatusBadge words), a plain sentence, and the next time that matters (estimated delivery, pickup hours).
- OrderTimeline: Order placed, Paid, Accepted by seller, Preparing, Ready (or Ready for pickup), Delivered or Completed. Done steps green with a check and time, the current step ringed in orange, upcoming steps muted.
- Items: photo, name, quantity, line price; breakdown (Items, Delivery, Total) with cents.
- Delivery card (address, courier note) or Pickup card (address, hours).
- Seller card: avatar, name, rating, **Message seller** with an unread dot. While the order is live the same button is also the sticky bottom bar.
- Payment card: status chip and method (never a provider name).
- After completion: "How was your order?" prompt with five empty stars and **Rate this order**, then the chat-open-until line.
- "Report a problem" link at the bottom of every order that has been paid.

## States
Preparing (live, sticky Message seller), Completed (rate prompt, pickup variant), Cancelled before payment (red timeline stop, "Not charged"), Refunded after seller cancel (cancel reason, grey Refunded step with the timeframe and amount). Awaiting payment shows a warning banner with **Complete payment** above the timeline. Loading uses the Skeleton card layout; error shows "Couldn't load this order" with Retry.

## Rules
- Status words match StatusBadge: Completed is green, Preparing amber, Cancelled and Refunded neutral. A cancelled step uses red only on the dot, never on the whole card.
- Times are in the viewer's zone with the zone on estimates ("2:10 to 2:40 PM MSK").
- Breakdown shows cents and true minus on refunds.
- Rate prompt shows once, disappears after a review exists (the card then shows the customer's own review with Edit for 48 hours).
- Report a problem is a quiet link, not a red button.
- Never name a payment provider.

## Upgrade
Built today: a generic transaction detail (`mobile/app/orders/[id].tsx`, `web/components/hub/marketplace-order.tsx`) with a status block and order summary. New: the seller-stage timeline, Message seller with unread dot (order chat), the rate prompt, Report a problem link, cancelled and refunded variants with reasons, delivery and pickup cards.

## Code
`mobile/app/orders/[id].tsx`, `web/components/hub/marketplace-order.tsx`

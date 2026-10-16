# SellerOrderDetail

## Purpose
One order, everything needed to act on it: what was ordered, who it is for, where it goes, what happened so far, and the next action.

## Anatomy
- Back link, "Order CIU-1001", relative time, status badge, fulfilment chip (Delivery, Pickup, Digital, Booking) and due timer.
- Exception banner when the order needs Ciuna support (no actions are offered).
- Items card: table (item, quantity, unit price, total), then subtotal, delivery fee and total. Cents are shown because it is a breakdown.
- Customer note (only if present), booking time or digital content when relevant.
- Customer card: name, tap-to-call phone, mailto email, "Message the customer" link to the order chat.
- Delivery address (Deliver to) or Pickup (address and hours).
- Timeline of events with date and time.
- Actions: Accept, Start preparing, Mark as fulfilled, Reject. Only the actions the order allows appear. Phones: sticky bar above the bottom nav (Reject secondary, the one next action primary). Desktop: at the end of the right column.
- Sheets: Mark as fulfilled (note required; digital orders also require the content) and Reject (reason required, states the refund).

## States
New (Accept, Reject); accepted (Start preparing); preparing (Mark as fulfilled); fulfil sheet with validation; digital fulfil sheet; reject sheet with validation; exception banner; completed (no action bar, timeline closes with the fulfilment note); loading skeleton and not-found are the same as the orders list.

## Rules
- The next action is the one primary button; Reject is always secondary and always asks for a reason and says the customer is refunded in full.
- Errors say what to fix ("Add a note for the customer.") and sit under the field.
- Overdue timers say "Overdue by 3 min" in words.
- Phone and email are links, never plain text, with 48px targets.

## Upgrade
Built in `seller/app/(shell)/orders/[id]/page.tsx` and `seller/components/orders/order-actions.tsx`. Differences:
- Desktop two-column layout starts at 1024px here; the built page switches to two columns only at 1280px (`xl`), so a 1200px window shows one column.
- Phone action bar: built stacks the buttons full width (a tall bar); here Reject and the primary share one row.
- The Reject sheet names the refund amount (built says "refunded in full" without the amount).
- Completed state shows the closing timeline note; no other change.

## Code
`seller/app/(shell)/orders/[id]/page.tsx`, `seller/components/orders/`

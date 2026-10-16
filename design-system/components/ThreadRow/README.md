# ThreadRow

## Purpose
One conversation per order in the seller inbox, so unread messages and urgent orders are found at a glance.

## Anatomy
Customer name, order number and relative time, unread count badge, up to two lines of the last message, order status badge and, when closed, a "Chat closed" chip. The whole card is one link.

## States
Unread (primary border, bold preview, count), read, last message from you ("You:" prefix), closed (muted background, chip), other language text.

## Rules
The count badge is the only filled orange element and appears only when unread. The status badge follows the status colour rules. Previews clamp at two lines and never reveal contact details.

## Upgrade
Matches `seller/components/messages/thread-row.tsx`.

## Code
`seller/components/messages/thread-row.tsx`

# OrderCard

## Purpose
A seller's order in a list or board.

## Anatomy
Order number, age, items summary, total, fulfilment chip, SLA timer, next action.

## States
new (amber, SLA running), accepted, preparing, ready, done; overdue turns the timer destructive-text.

## Rules
One next action per card. Reject lives in the detail.

## Upgrade
New in Seller.

## Code
`seller/components/orders`

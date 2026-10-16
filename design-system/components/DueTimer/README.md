# DueTimer

## Purpose
Tells the seller how long they have to act on an order or booking before it breaches the SLA.

## Anatomy
Pill with a timer icon and a sentence: "Due in 12 min", "Due in 1 h 20 min", "Overdue by 6 min". 28px high on cards, 36px in the detail header.

## States
- Running: neutral, more than 5 minutes left.
- Warning: under 5 minutes, warning pair.
- Overdue: destructive pair and the word "Overdue".
- None: nothing rendered when there is no due time or the order is no longer live.

## Rules
Always words plus colour. Minutes only, hours and minutes from 60 minutes. Refreshes every 30 seconds. Localised (en, ru, fr, es, zh, pt). Never uses orange.

## Upgrade
Built today: running and overdue. New: the warning state under 5 minutes and the 36px size.

## Code
`seller/components/orders/due-chip.tsx`

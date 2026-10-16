# StatementRow

## Purpose
One order's money in the Earnings statement: what was sold, what Ciuna took and what the seller keeps.

## Anatomy
Table (desktop): order number and customer, date, items, delivery, Ciuna fee (negative, destructive text), You keep (bold), status badge with a date line. Phone: stacked row with order and date, status badge, key-value lines, a rule above You keep, and a "when" line.

## States
Available ("Available since Oct 21"), Pending ("Available on Oct 22"), Reversed (muted row, net struck through, reason). Filtered by All, Pending, Available, Reversed tabs.

## Rules
Rows round to whole rubles in lists (no `.00`); the detail uses `FeeBreakdown` with cents. Fee uses a true minus `−₽80`. Bookings show "–" for delivery. Status always has a word and icon.

## Upgrade
Built today: statement rows with gross, fee and net. New: the stacked phone layout and reversed styling.

## Code
`seller/app/(shell)/earnings/page.tsx`

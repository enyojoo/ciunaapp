# OfficeDashboard

## Purpose

Office home: show what needs action first, with age and SLA, then the day's numbers and recent activity.

## Anatomy

- Header with date and export.
- Four key tiles: transfers today, send volume, new customers, failed transfers.
- Needs action table: queue, waiting count, oldest item, SLA, items mine, Open queue. Most overdue first.
- Volume by service line (bars with amounts) and recent activity feed.

## States

- Ops: all queues. Support: only support queues, other sidebar groups hidden. Finance: payouts, refunds, settlement and money tiles.
- All clear: tiles stay, the queue card confirms nothing is waiting.
- Loading: skeleton in the same layout.

## Rules

- Queues sort by overdue first; breaches say "Over by 27h", never colour alone.
- A queue the role cannot act on is hidden, not disabled.
- Money uses ₽ with thousands separators and no .00.
- Counts in the sidebar match the Needs action table.

## Upgrade

Differs from built Office: the built page shows four totals (transactions, volume, users, pending), an activity list and service line popularity. Upgrade adds the Needs action queue table with age, SLA and ownership, role variants, and an all-clear state.

## Code

office/app/dashboard/page.tsx

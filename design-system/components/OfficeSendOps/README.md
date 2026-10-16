# OfficeSendOps

## Purpose

One screen for the Send desk to see today's volume and health, work the four queues that need a person, and pause a corridor when a provider is down.

## Anatomy

- Tiles: send volume today, success rate, median delivery, needs-attention count.
- Queue cards: Payments waiting over 30 min, Payouts failed, Payouts stuck, Refunds pending. Each shows count, SLA target, oldest age, rows with reference, customer, corridor, age and owner or Claim, and Open queue.
- Provider status: YooKassa (payments in, SBP and cards), Bitbanker (conversion, payouts per currency) with Up, Degraded or Down, last-hour detail, last check, and a Maintenance switch for finance.
- Banner when a corridor is paused by maintenance.
- Maintenance dialogs (on, off) with reason, expected end and what customers see.
- Role matrix.

## States

- Healthy, degraded (CNY payouts at 71%) and down (KES payouts), with maintenance on for Kenya.
- Queue empty ("Nothing stuck").
- Age warnings: warning text near the SLA, destructive text over it.
- Ops: no switches. Support: counts only, provider names and ids replaced by plain labels, no Claim.

## Rules

- Queue SLAs are seed examples, invented for this card: 30 min for payments, 2 h for failed payouts, 60 min for stuck payouts, 1 business day for refunds. Office can change them.
- Maintenance for a corridor blocks new transfers to it and shows customers "Sending to Kenya is paused"; it does not cancel paid transfers. It needs a reason and writes to the audit log. Only finance and super_admin.
- Provider names and ids are Office only; support never sees them.
- Items can be claimed; a claimed item shows the owner.
- Maintenance mode for the whole platform is separate (API 503 on money routes) and not on this screen.

## Upgrade

New. Not built today; transfers are reviewed only through the Transactions list. Needs: a provider health check job (status, rolling success rate), a corridor pause flag read by the quote endpoint, queue queries over transactions (age by status), claim and owner fields on transfers, and the daily metrics query.

## Code

office/app/send-ops (new), api/app/api/admin/transactions

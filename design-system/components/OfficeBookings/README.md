# OfficeBookings

## Purpose

Follow expert sessions and resolve disputes between customer and expert.

## Anatomy

- Tabs (Upcoming, Disputes, Completed, Cancelled, All), search, expert and status filters.
- Table: booking, customer, expert, service and length, start in Moscow and in the expert's zone, status, dispute flag.
- Detail: both times, meeting link with copy, payment hold, both sides of a dispute, decision (partial refund, full refund, pay expert) and note.

## States

- Confirmed, Awaiting expert, Completed, Cancelled, Disputed.
- Dispute age shown; empty Disputes tab confirms nothing is open.

## Rules

- Times always show the customer's zone and the expert's zone.
- Money stays held until a dispute is resolved; the decision names the amount.
- The note is sent to both sides and logged.

## Upgrade

Built: bookings table with expert filter and a status select per row. New: dual-zone times, meeting link, dispute view with decision, status as read-only badge changed by actions.

## Code

office/app/bookings

# OrderTimeline

## Purpose
The customer's and seller's shared view of where an order or booking stands.

## Anatomy
Header with order reference and current status badge; vertical list of stages, each with a dot (done, now, upcoming, neutral), name, time, and actor or note; optional meeting link or pickup code in the current stage.

## States
delivery in progress, pickup ready, cancelled (with refund), refunded after delivery, booking with meeting link, long Russian text.

## Rules
Stage names match StatusBadge words exactly. Done = success dot with check; current = primary ring; upcoming = empty dot, muted; Cancelled and Refunded = neutral dot. Every stage shows a time and who acted. Bookings show the viewer's time zone. No payment provider names.

## Upgrade
Extends the existing transaction timeline; adds pickup, cancelled-with-refund, partial refund and booking variants.

## Code
`web/components/transaction-timeline.tsx`

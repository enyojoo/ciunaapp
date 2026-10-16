# TimeOffPanel

## Purpose
Lets an expert block open slots across a date range (holiday, illness, travel) without editing weekly hours.

## Anatomy
Card with first and last day off, service select (All services or one), time-zone hint, "Block these dates". A confirm dialog repeats the range, scope and time zone. Result: toast with the count of blocked slots and a banner listing sessions already booked in the range.

## States
default; invalid range (end before start); confirm; busy; success ("28 slots blocked."); booked sessions inside the range.

## Rules
Whole days in the expert's time zone. Existing bookings are never changed or cancelled here. Confirm always names scope and zone. Blocked slots can be unblocked one by one.

## Upgrade
Built today in the expert availability page. New: the booked-sessions notice after blocking.

## Code
`seller/components/expert/availability-editor.tsx`

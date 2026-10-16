# SellerAvailability

## Purpose
Let an expert say when they can be booked, see exactly which slots that creates, and block time off.

## Anatomy
Schedule settings (service, time zone, slot length, bookable-from and until with a 90-day cap), Weekly hours (Mon to Sun, several ranges per day, Add hours, Copy to other days, per-row delete), Next 14 days preview grouped by date, Time off (date range, service or all services), Upcoming slots list (range select, Open, Booked, Blocked, Block, Unblock, View booking, delete). Sticky save bar.

## States
Default; overlap and end-before-start errors under the day (Save disabled with a fix hint); copy sheet open; empty preview; no weekly hours (warning that saving removes open slots); time off confirm with the count of slots blocked; booked slots cannot be changed or deleted.

## Rules
All times show the zone they are in, and the zone is named wherever a time appears. Saving rebuilds open slots and never touches booked sessions, and the bar says so. Window is capped at 90 days. Block and Unblock are one tap; delete confirms. Weekly range inputs are 40px tall on desktop and grow to 48px tap targets on phones in the build.

## Upgrade
Built in `seller/components/expert/availability-editor.tsx` with `time-off-panel.tsx` and `upcoming-slots.tsx`. Differs: the two-column desktop arrangement, the preview grouped by date as a list of time chips (built is a flat list) and the Next 14 days empty state are design proposals.

## Code
`seller/app/(shell)/availability/page.tsx`, `seller/components/expert/`

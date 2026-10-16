# SellerBookings

## Purpose
Answer paid booking requests, prepare upcoming sessions and finish them.

## Anatomy
Tabs Requests, Upcoming, Past with counts. Booking card (customer, service and price, time with zone, status badge, respond-by timer, actions). Detail: customer, session facts with session time and device time in their own zones, note, meeting link form (https link and instructions), sticky actions Accept or Decline, then Mark as completed and Decline.

## States
New request; overdue request; accepted with and without a meeting link; link error (must start with https://); session in progress or not yet ended (complete disabled with unlock time); completed; cancelled and refunded; empty per tab; needs attention from Ciuna banner.

## Rules
Times always name their zone (session zone first, device zone second when different). Decline requires a reason and says the customer is refunded in full. Mark as completed is disabled before the session end and explains why. Status is a word plus colour. One primary action per state.

## Upgrade
Built in `seller/app/(shell)/bookings/page.tsx` and `[id]/page.tsx` with `booking-time.tsx`. Differs: the desktop two-column request list, the Complete sheet with an optional note, and the refund amount in the decline sheet are design proposals.

## Code
`seller/app/(shell)/bookings/`, `seller/components/expert/booking-time.tsx`

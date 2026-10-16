# ExpertBooking

## Purpose
Takes a customer from "I want an hour with Carlos" to a paid, confirmed meeting without leaving the app, and is honest about time zones and what happens to the money.

## Anatomy
- Top bar with the expert, a "Step n of 5" line and ProgressBar.
- 1 Service: radio cards with length, mode and price.
- 2 Date and slot (SlotPicker): five-day strip, slot chips in a three-column grid (48px), and a time-zone card: "Times in your time zone: Moscow (MSK, UTC+3). Carlos is in Madrid (CEST, UTC+2). 6:00 PM MSK is 5:00 PM there."
- 3 Details: name, optional notes (1000 characters) with the line "Carlos sees this before the session".
- 4 Pay: summary with cents, RUB methods (Bank card, SBP), the hold line "Held until Carlos confirms. If he declines, you get ₽2,400 back." Sticky **Pay ₽2,400**.
- 5 Confirmation: first "Awaiting confirmation from the expert" (amber), then "Confirmed" (green) with the meeting link, copy, Add to calendar and **Join meeting**.

## States
Awaiting confirmation, Confirmed (link opens 10 minutes before start), Declined or expired (neutral, refund line with timeframe), Slot just taken (red banner, struck-through slot, details kept, nothing charged), Payment failed (inline error on step 4 with Try again), Loading slots (chip skeletons), No slots (links to the profile hint).

## Rules
- Always show both time zones: the viewer's first, then the expert's with their city.
- A slot is reserved when payment starts and released after 10 minutes without payment.
- The money is held until the expert confirms; a decline or no reply in 24 hours refunds in full.
- Customer and expert screens never name a payment provider; methods are named by what the customer does ("Bank card", "SBP").
- The meeting link is shown only after confirmation.

## Upgrade
Built today: a booking wizard (`web/components/hub/expert-booking-wizard.tsx`, `mobile/app/experts/book/[serviceId].tsx`) with service, slot and pay. New: two-zone time line, notes with visibility line, awaiting versus confirmed confirmation, meeting link and calendar add, slot-taken and declined states.

## Code
`web/components/hub/expert-booking-wizard.tsx`, `mobile/app/experts/book/[serviceId].tsx`

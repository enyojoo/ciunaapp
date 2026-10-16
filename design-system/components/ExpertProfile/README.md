# ExpertProfile

## Purpose
Gives a customer enough trust and detail to book: who the expert is, what they are qualified for, how others rated them, and when they are free.

## Anatomy
- Photo (88px circle), name, headline, Verified badge (success), spoken languages, rating with review count and years in practice.
- About, Credentials (education, bar or licence membership, "Identity and licence checked by Ciuna"), intro video placeholder with duration.
- Availability hint: "Next available: tomorrow, 10:00 AM MSK".
- Services list: name, length, mode (online or in person), price, **Book** on each row. A sticky "Book a session" bar keeps the action in reach.
- Reviews section below (same card as the store page ReviewFlow).

## States
Loaded; Loading (photo and text skeletons); No availability (warning banner, Book becomes "No times available", "Notify me" action); Unpublished or removed (expert is never shown; direct link lands on "This expert isn't available" with Browse experts); Error with Retry.

## Rules
- Only published and verified experts have a public profile. Unpublishing hides it everywhere at once.
- Next-available uses the viewer's time zone with the zone named.
- A service shows its price in RUB with no decimals when whole.
- Video is optional; without one the block is not rendered (the placeholder here shows the 16:9 slot).
- Never show contact details; all talk goes through the booking.

## Upgrade
Built today: profile page in `mobile/app/experts/[slug].tsx` and `web/components/hub/expert-profile-view.tsx` with services. New: verified badge, credentials block, intro video slot, availability hint, no-availability and unpublished states, review summary.

Not built (design proposal only): "Notify me when she opens times" on the no-availability state, and the "Video coming soon" intro video slot. Treat both as New and confirm before building.

## Code
`mobile/app/experts/[slug].tsx`, `web/components/hub/expert-profile-view.tsx`

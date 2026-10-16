# ReviewFlow

## Purpose
Lets a customer rate a completed order in one tap and shows how that rating appears publicly on the store (or expert) page.

## Anatomy
- Sheet over the order screen: title ("Rate your order"), store and order number, five star buttons (48px each) with a word under ("Good", "Excellent"), optional textarea with a counter (1000 max), a notice "Shown with your first name only: Amara", **Submit review**.
- Edit sheet: same fields prefilled, a line stating how long editing stays open, **Save changes** and Cancel.
- Locked sheet: read-only stars and text and a neutral note.
- Store page Reviews tab: average, count, distribution bars, review cards (first name, date, stars, text) with the seller's reply in a grey inset.

## States
First time (submit disabled until a star is picked), Edit (within 48 hours of writing), Locked (after 48 hours, read-only), Window closed (30 days after completion, no sheet), Submitting (busy button), Error ("Couldn't post your review. Try again."), Thank-you toast "Thanks, your review is posted". Seller reply: shown once; the seller can edit for 24 hours; replies are 600 characters at most.

## Rules
- Only the customer of a completed order can review; one review per order.
- Stars are required, text is optional. Reviews show first name only, never last name or avatar photo.
- Orange stars use primary-text on white; empty stars are hairline grey, never colour alone (the word under the stars repeats the value).
- Moderation by Office: a hidden review disappears from the store page and from the average.
- Same flow for expert bookings, with "Rate your session".

## Upgrade
New. SQL rules and APIs exist (`api/lib/merchant/reviews.ts`, `api/app/api/hub/orders/[id]/review`, public review lists on vendors and experts); no customer UI yet.

## Code
To build in `mobile/components/review-sheet.tsx` and `web/components/hub/review-dialog.tsx`.

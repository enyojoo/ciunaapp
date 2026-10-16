# SellerReviews

## Purpose
Show a seller how customers rate them and make replying quick.

## Anatomy
Summary card (average, count, five-row distribution with counts). Tabs All and Needs reply with a count. Review card (customer, date, order, stars, text or No written review, reply or Reply button). Reply sheet (public notice, textarea, counter, edit window, Post reply). Show more at the end of the list.

## States
All; Needs reply; replied with Edit reply; no written review; reply sheet default, error and over 600; empty (no reviews); caught up (no review needs a reply); no access.

## Rules
Stars are always paired with a number or label. The reply is public and the sheet says so before posting. Replies are editable for 24 hours. Counter reads used / 600. Distribution bars use the primary fill on a neutral track.

## Upgrade
Built in `seller/app/(shell)/reviews/page.tsx` with `seller/components/reviews/`. Differs: the desktop side-by-side summary and the dedicated error state of the reply sheet are design proposals.

## Code
`seller/app/(shell)/reviews/page.tsx`, `seller/components/reviews/`

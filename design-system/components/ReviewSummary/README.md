# ReviewSummary

## Purpose
Summarises ratings on a product, store or expert page and offers the write-a-review action.

## Anatomy
Average (48px), stars, count; five horizontal bars with counts per star level; call to action line.

## States
can review, already reviewed (Edit your review), cannot review yet (disabled with reason), no reviews, no reviews and cannot review, one review.

## Rules
Average is text to one decimal; stars round. Bars always show five rows. Count excludes reviews hidden by moderation. Write a review is only enabled for customers with a completed order or booking, and the reason is stated when it is not. Singular and plural are handled.

## Upgrade
New; follows the ratings and reviews rules.

## Code
`web/components/hub/review-summary.tsx` (new)

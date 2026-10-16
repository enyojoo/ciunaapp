# RatingStars

## Purpose
Shows an average rating and collects a 1 to 5 rating from a customer.

## Anatomy
Display: five stars (filled up to the rounded value), number, optional count. Input: five 48px radio targets and a word naming the value.

## States
Display sm / md / lg, few reviews, no reviews. Input: empty, hover or press preview, selected, keyboard focus.

## Rules
Half values are text (4.6), stars round to whole. Display group has one aria-label with value, scale and count. Input is a radiogroup. The count is always shown on tiles. No reviews shows empty stars and 'No reviews yet', never 0.0.

## Upgrade
Existing `.stars` markup is display-only and has no input mode; input and the word labels are new.

## Code
`web/components/ui/rating-stars.tsx`, `mobile/components/rating-stars.tsx`

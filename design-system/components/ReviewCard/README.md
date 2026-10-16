# ReviewCard

## Purpose
A single customer review under a product, store or expert.

## Anatomy
Avatar initial, first name, date, Verified order mark, stars, text (clamped at 4 lines with Read more), optional seller reply in a grey block with store name and date.

## States
default, with seller reply, rating only, long text (clamped), Russian and Chinese text, moderated (not rendered).

## Rules
First name only. Verified order mark appears only for reviews tied to a completed order or booking. Reviews hidden by moderation are removed from the list, the count and the average for customers, with no placeholder and no reason; the reason is shown to the seller in Seller and to Office. Seller replies are one per review.

## Upgrade
New. Follows the ratings and reviews rules and APIs (customer, public, seller, Office).

## Code
`web/components/hub/review-card.tsx` (new), `mobile/components/review-card.tsx` (new)

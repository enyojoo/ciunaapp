# ReviewReplyCard

## Purpose
The seller's view of one customer review, with the way to reply publicly once and edit within a limited window.

## Anatomy
Stars, customer first name and date, review text, the seller's reply in a neutral well, edit-window note, Reply or Edit reply button. The reply sheet repeats the review quote, a labelled textarea, a used / max counter and a Send reply or Save footer.

## States
Needs a reply, replied and editable (with hours left), replied and locked, rating with no text, reply sheet empty or filled, over the 500 character limit (error and disabled Save).

## Rules
Replies are public. Sellers cannot delete reviews. Only first names are shown. The counter turns destructive over the limit and says how many characters to remove.

## Upgrade
Matches `seller/components/reviews/review-card.tsx` and `reply-sheet.tsx`; new is the edit-window note and locked state shown explicitly.

## Code
`seller/components/reviews`

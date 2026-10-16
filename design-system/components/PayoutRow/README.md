# PayoutRow

## Purpose
One withdrawal in the payout history on Earnings, with its status, method and the next thing the seller can do.

## Anatomy
Amount (bold, tabular), method with masked detail and date, status badge, an optional note well (reference or rejection reason), and a Cancel request button while Requested. On phones the badge stays beside the amount and the button goes full width below.

## States
Requested (warning, cancel action), Approved (warning, "being sent"), Paid (success, with payment reference), Rejected (destructive, reason), Cancelled (neutral, amount struck through).

## Rules
Money follows the money rules: whole rubles in lists. Method details are masked. The reason on a rejected payout says what to fix. Only Requested payouts can be cancelled. No provider names.

## Upgrade
Mostly as built in `seller/components/earnings/statement.tsx` payout list; new is the stacked phone layout, reference note and cancel button placement.

## Code
`seller/app/(shell)/earnings/payouts`

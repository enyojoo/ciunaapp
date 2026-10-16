# SellerEarnings

## Purpose
Show a seller what they have earned, what is waiting and what has been paid out, and let finance or the owner withdraw.

## Anatomy
Page header with Withdraw; Earnings / Payouts / Payout methods sub-tabs; balance card per currency (Available at display size, then Pending with the hold note, In payout, Paid out); Statement (tabs All, Pending, Available, Reversed; table on desktop, stacked cards on phones with items, delivery, Ciuna fee, You earn); Download statement (From, To, Download CSV); Withdraw sheet (currency, method, amount, Withdraw all, fee preview, Request payout).

## States
Default; no earnings yet; invalid date range; Withdraw with fee preview; more than available; below the minimum; method waiting for verification; no method for the currency. Reversed rows are struck through and muted.

## Rules
Money in is never red or green. Fee shows as a negative; breakdowns keep cents. Every status has a word and an icon. The pending note names the hold days. Errors say what to fix and keep the sheet open.

## Upgrade
Built in seller/components/earnings. Differs: the cents breakdown with an example 1% fee, and the combined no-method banner with a Manage methods button, are design proposals; the phone Withdraw button sits beside the title.

## Code
seller/app/(shell)/earnings/page.tsx, seller/components/earnings/

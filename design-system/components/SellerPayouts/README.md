# SellerPayouts

## Purpose
Show every payout request and where it stands, and let the seller cancel one before it is approved.

## Anatomy
Payout card: amount, requested date, status badge, fee, amount received, method, then Paid on and Reference (paid) or Reason (rejected), a one-line note, Cancel request (requested only). Cancel confirm dialog. Empty state.

## States
Requested, Approved, Paid, Rejected, Cancelled; cancel confirm; empty.

## Rules
Requested and Approved are amber, Paid green, Rejected red, Cancelled neutral. The note says what happened to the money. Cancel returns the money at once and says so.

## Upgrade
Built in seller/app/(shell)/earnings/payouts/page.tsx. Differs: two-column desktop grid and the paid date and time shown in MSK are proposals.

## Code
seller/app/(shell)/earnings/payouts/page.tsx

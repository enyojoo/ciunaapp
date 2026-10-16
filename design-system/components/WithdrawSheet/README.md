# WithdrawSheet

## Purpose
Lets a seller request a payout of available earnings, showing exactly what they will receive before they confirm.

## Anatomy
Title and timing sentence, Method select (verified methods only), Amount input with Withdraw all, hint with available balance and minimum, a well with You request, Payout fee and You receive, footer with Cancel and Request withdrawal.

## States
Ready (preview shown), empty (button disabled), busy, errors: more than available, below minimum, no verified method (warning banner with Manage methods link).

## Rules
The fee preview comes from the server and is only shown for a valid amount. The primary button stays disabled until amount, method and preview all exist. Errors state the number to fix. Phone: the sheet is a bottom sheet with a sticky footer. No provider names.

## Upgrade
Matches `seller/components/earnings/withdraw-sheet.tsx`; new are the stated minimum in the field hint and the error wording.

## Code
`seller/components/earnings/withdraw-sheet.tsx`

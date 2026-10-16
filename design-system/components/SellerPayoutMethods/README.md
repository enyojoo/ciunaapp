# SellerPayoutMethods

## Purpose
Manage where Ciuna sends a seller's money, with verification made visible.

## Anatomy
Verification banner; method rows (name, details, Verified or Waiting for verification, default marker, Make default, Remove); Add method sheet with type choice (SBP, Bank account, Ciuna Send as Coming soon), type-specific fields, optional name, privacy note; remove confirm; empty state.

## States
Verified default; verified; waiting; add SBP; add bank account with card-number error; remove confirm; empty.

## Rules
No card numbers are accepted; only the last 4 digits are shown after saving. SBP pays RUB only. A method with payout history cannot be removed (the error tells the seller to make another the default). Provider names never appear.

## Upgrade
Built in seller/app/(shell)/earnings/methods and add-method-sheet.tsx. Differs: the card-number error copy and the Ciuna Send option as a disabled row are proposals.

## Code
seller/app/(shell)/earnings/methods/page.tsx, seller/components/earnings/add-method-sheet.tsx

# OfficeMerchantMoney

## Purpose

One merchant's money: what is held, available, in payout and paid, per currency, with the payout methods that receive it.

## Anatomy

- Back link to the review page.
- Balance cards per currency: Pending, Available, In payout, Paid out, Lifetime net.
- Payout methods with status badge and Verified switch.
- Earnings and Payouts tables.

## States

- Finance role with two currencies.
- Support: switch hidden with a stated reason.
- No earnings yet: plain empty message.

## Rules

- Currencies are never converted.
- Pending earnings show when they release.
- Switch only for roles that can verify; the change is audited.

## Upgrade

Built

## Code

office/app/finance/merchants/[id]/page.tsx

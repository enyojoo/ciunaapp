# OfficeFees

## Purpose

Set what Ciuna charges: commission rules by scope, payout fees, plans and marketplace money settings.

## Anatomy

- Tabs: Commission rules, Payout fees, Plans; link to money settings.
- Rules table grouped by scope (merchant, category, service line, platform) with percent, fixed, min, max, dates, active switch and actions; payout fees add Waive above.
- Rule dialog with scope, currency, amounts, dates, note and Active.
- Plans table with Not billed yet; fee calculator that names the rule used.
- Money settings: payout hold days and minimum payout per currency.

## States

- Inactive rules are dimmed.
- Validation blocks Save and says what to fix.
- Note that edits do not change accepted orders.
- No plans or no minimums: plain empty rows.
- Non-finance role: forbidden notice, no edits.

## Rules

- The most specific active rule wins: merchant, plan, category, service line, platform.
- Fixed amounts and limits need a currency; a percent-only rule applies in every currency.
- Deleting a rule asks first and says what happens next.

## Upgrade

Differs from built Office: Built has the same tabs and dialogs. Upgrade makes the accepted-orders note a visible banner on every tab and lists the calculator beside plans.

## Code

office/app/fees/page.tsx, office/app/fees/settings/page.tsx, office/components/finance/*

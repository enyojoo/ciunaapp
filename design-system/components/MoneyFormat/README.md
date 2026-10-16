# MoneyFormat

## Purpose
The rules table for formatting money, rates, converted amounts, fees and statements, so every screen, email and export shows the same figures.

## Anatomy
Rules: symbol first, comma thousands, dot decimals, no `.00` in lists, cents always in breakdowns and balances, no decimals for zero-minor currencies, true minus, tabular figures. Rates: `$1 = ₽92.40`. Converted: amount in the viewer's currency in bold, `≈` converted figure muted with the rate used. Fee lines: label muted left, amount right, total bold under a 2px ink rule. Earnings statement: items, delivery, Ciuna fee, adjustments, net payout.

## States
Whole amount in a list (`₽1,250`) vs breakdown (`₽1,250.00`). Credit `+₽1,250`, debit `−₽450`. Exact (charged) vs approximate (`≈`). Rate older than 15 minutes shows its time with the time zone.

## Rules
- Use `formatMoney` / `formatMoneyDisplay` and `Amount`; never format by hand.
- Symbols not codes; letter symbols (CFA) take a space.
- Rates use symbols on both sides; rates of 1 or more show two decimals (whole drops them); under 1 show two or three significant digits.
- Rows that add up show cents so the column aligns and the total visibly sums; discounts and fees use `−`.
- Name every fee ("Ciuna fee (8%)"); never hide or merge fees. No provider names on customer or seller screens.
- No abbreviations like `₽1.2M`.

## Upgrade
Seller earnings and payout tables and several customer receipts still hand-format; move them to the shared formatter and the statement layout here.

## Code
`packages/shared/src/format-money.ts`, `packages/shared/src/format-money-display.ts`

# SellerStatement

## Purpose
The record a seller keeps for their books: what each order earned, what Ciuna took, what was paid out and what is left. Downloadable as a PDF page and as a CSV.

## Anatomy
Logo and statement number top-right with the generated time and zone; business, period and currency; an orders table (order, date, items, delivery, Ciuna fee, net) with a total row; payouts in the period (date, reference, status, amount); closing balance (net earnings, paid out, pending with its release date, available balance). CSV columns, in order: `order, date, currency, items, delivery, ciuna_fee, net, status, available_on`.

## States
- Statement with orders and one paid payout (shown).
- Empty period: "No fulfilled orders from Oct 1 to Oct 15." with the closing balance only.
- Reversed earnings (refunds): a row with status reversed and a negative net.
- One currency per statement; sellers in several currencies download one per currency.

## Rules
- Money in breakdown format with cents on the PDF; plain numbers in major units in the CSV.
- Fee and payout deductions use the true minus `−`.
- Period dates are UTC and the page says so; the generated time shows MSK.
- Status uses the shared words: Paid (payout), pending / available / reversed (earnings).
- No provider names; a payout reference is ours (PAY-xxxxx).

## Upgrade
Built today: the CSV export in `api/app/api/merchant/earnings/export/route.ts` with exactly these columns (date from `fulfilled_at`, `available_on` from `released_at`). New: the PDF statement page, payouts in the period and the closing balance block; a download button for both on the Seller earnings page.

## Code
`api/app/api/merchant/earnings/export/route.ts`, `seller/` earnings page

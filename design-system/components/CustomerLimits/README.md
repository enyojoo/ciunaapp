# CustomerLimits

## Purpose
Answers "how much can I send?": what is used this month, what is left, when it resets, and how to raise it.

## Anatomy
Header. Plate with "This month", the amount left in 34px, a usage bar, used of limit, and the reset date. Per transfer row (minimum and maximum). Levels list: Level 1 email and phone, Level 2 identity, Level 3 identity and address, each with its monthly limit; the current level is tinted and carries the usage bar; passed levels show a check. Sticky action: Verify identity or Verify address.

## States
Within the limit; close to the limit (80% and over, warning pair); limit reached (destructive pair, bar full); opened from Send with a transfer that does not fit; verification in review (warning banner, current limit still applies); highest level (Contact support); Russian; offline cached.

## Rules
All numbers are examples drawn on the card (₽50,000, ₽600,000, ₽2,000,000 per month for levels 1 to 3, ₽1,000 to ₽600,000 per transfer); the real values come from Office compliance settings and must not be hard-coded. The bar is always paired with figures. The remaining amount comes first. The reset date is shown with the limit (assumed calendar month; compliance confirms). The screen never suggests splitting a transfer to avoid a limit. One primary action.

## Upgrade
Built: `mobile/app/limits.tsx` (opened from More, and named in the Send error), with the API `GET /api/limits` and limits enforced in `api/app/api/send/quotes` and `send/transfers`. Shows what is left, the usage bar (warning at 80%, danger when reached), used of limit, reset date, per-transfer minimum and maximum, the three levels with the current one tinted and passed ones checked, the in-review banner, and Verify identity or Verify address. Send explains a refused transfer (what is left and when it resets, or the most or least per transfer). Amounts are never hard-coded: compliance sets them per level (`send_limits`, `GET`/`PUT /api/admin/send-limits`); until a level has a row nothing is limited and the screen says so. Limits apply to transfers sent in the limit's own currency. Not built: an Office screen for editing limits (the API exists).
## Code
Proposed: `mobile/app/limits.tsx`, `api` usage endpoint

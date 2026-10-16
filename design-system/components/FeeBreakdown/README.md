# FeeBreakdown

## Purpose
Explains an order's earnings line by line on the order detail and the earnings detail, so the fee is never a surprise.

## Anatomy
Title (order or booking number), lines for items (or service), delivery, Ciuna fee in destructive text with the rule name beneath ("Food 8%", "Expert services 10%"), a rule, **You keep** in bold, and a "when available" note in a neutral well with an icon.

## States
Pending (hourglass, date), Available (check, "since" date), Reversed (muted, You keep ₽0.00, reason), store order with or without delivery, expert booking without a delivery line.

## Rules
Cents are kept because the lines add up. True minus `−₽72.00`, tabular figures. The fee line always shows its rule name. The note always gives a date. Seller and customer language never names payment providers.

## Upgrade
New: rule name under the fee, the when-available note and the reversed state.

## Code
`seller/components/orders` (order detail) and `seller/app/(shell)/earnings` (to extract)

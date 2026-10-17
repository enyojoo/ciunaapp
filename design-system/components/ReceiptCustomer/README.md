# ReceiptCustomer

## Purpose
Proof of what a customer paid, for an order or a booking. Opens in the app, downloads as PDF, prints on A4 or Letter.

## Anatomy
Logo top-left, receipt number and date with time zone top-right, title with status badge, label/value rows (customer, store or expert, delivery address or session, pay method, pay currency), an items table (item, quantity, price, amount), a summary (items, delivery fee, total paid), footer with the support address. Booking variant replaces items with the service and shows the session in the customer's zone and the expert's.

## States
- Order, paid (screen and A4).
- Booking, paid (Letter), with both time zones.
- Refunded and cancelled: same page, badge changes and a "Refunded ₽1,250.00 on Oct 17" row is added under the total.

## Rules
- Total paid is in the pay currency. If the shop prices in another currency, the original price shows in the item row.
- Money format from the system: symbol first, cents in breakdowns, tabular figures.
- Dates: "Oct 16, 2026 • 2:14 PM MSK".
- No provider names; the pay method is "Card ending 4242" or the plain method name.
- Printed pages are white with no shadows; screen receipts sit on a white plate.

## Upgrade
Built as a receipt screen: `mobile/app/receipt/[kind]/[id].tsx` for a paid order or booking, opened from the order view (View receipt). The receipt is built on the server (`api/lib/receipts.ts`, route `api/app/api/receipts/[kind]/[id]`): store or expert, customer, delivery address or session in its own zone, items, fees, total paid, refunded variant, plain method name, not-a-tax-invoice line and the support address. Share sends a text summary. Not built: PDF download and print layout (needs a PDF library decision).

## Code
To be built with the customer order detail (`app/` order screens) and a PDF route in `api/`.

## As built (2026-10-19)
The PDF is built (expo-print and expo-sharing; the web opens the print dialog). Dates carry their time zone; a refunded receipt is grey and drops the rate rows.

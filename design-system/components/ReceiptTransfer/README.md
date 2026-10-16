# ReceiptTransfer

## Purpose
The record of a transfer the customer can keep, print or share: who sent, who received, what it cost and when.

## Anatomy
Screen: header with share, one plate with reference and status badge, date with zone, label and value block (From, To, Account, Paid with, Delivered), amount lines and bold Total paid, Download PDF and Share as image. Printed A4: logo and receipt number top, title and status, Sender, Recipient (masked account), Transfer (reference, created, delivered, method), amounts table, total, footer line. Shared image: logo, tick, amount the recipient got, recipient name, status, date, amount paid, rate, reference.

## States
Completed (screen, A4, image); refunded (screen with Refunded badge and a refund line, no recipient amount); cancelled and failed transfers have no receipt.

## Rules
Pay-currency amounts first, then rate and recipient amount, with cents. Dates carry a time zone. The recipient account is masked to the last four digits everywhere; the shared image also omits the sender's email and shows the recipient's name only. One status badge with word and icon. Payment method is a plain name. "This is not a tax invoice" stays on every page until tax documents exist. White page with a hairline on screen, no fill in print, 48px margins on A4.

## Upgrade
Differs from the built app: today only an uploaded payment proof can be opened from the transfer (`/api/receipts/documents`); a generated receipt, PDF download, shared image and the refunded variant are New.

## Code
`api/app/api/receipts/documents/route.ts` (proof files only today); generated receipts are new

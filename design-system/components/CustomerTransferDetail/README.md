# CustomerTransferDetail

## Purpose
One transfer in full: where the money is, what it cost, who gets it, and what the customer can do next.

## Anatomy
Header with back. Hero: status icon, one status badge, a headline that says what happened to the money, the amount the recipient gets (or the exact amount to pay while waiting) and one line with date and time zone. Timeline of four steps: Transfer created, Payment received, Sent, Delivered. Amounts plate: You sent, Fee with its percentage, Exchange rate, Recipient gets, Total paid under an ink rule. Recipient card (initials, flag, bank, masked account). Payment plate: method by name, reference with copy, date. Report a problem row. Sticky actions: Share receipt and Repeat transfer.

## States
Awaiting payment (warning, exact amount, rate lock and deadline, Cancel transfer and Show QR code); payment received, sending (warning); delivered (success); delivered scrolled; failed with refund pending (destructive on the failed step only, "Your money is safe"); refunded (neutral); cancelled because the payment window closed (neutral, "You were not charged"); Russian. Load error and offline reuse the shared retry and cached-banner patterns.

## Rules
Say what happened to the money first. One status word per state: Awaiting payment, Processing, Completed, Failed, Refunded, Cancelled. Every time carries its zone. Methods by name (SBP QR, Bank transfer, Pay online); no provider names. The reference copies on tap. Report a problem opens a support request with the transfer attached (no refund workflow in the app; Office decides refunds). Share receipt only appears when a receipt exists. Repeat transfer starts Send with the same recipient and amount and a fresh quote.

## Upgrade
Built in `mobile/app/orders/[id].tsx`: status, timeline, recipient, amounts, Repeat transfer (opens Send with the same currencies, amount and recipient) and Share receipt (a text summary for completed transfers). A PDF receipt needs a backend route.

## Code
`mobile/app/orders/[id].tsx`, `mobile/components/transaction-timeline.tsx`

## As built (2026-10-19)
Built in `mobile/components/transfer-detail.tsx`: status icon and badge, headline for what happened to the money, four-step timeline with times and zones (from transfer events), amounts with fee percent, masked recipient, payment reference that copies on tap, Report a problem (opens a support request with the transfer in the subject), pinned Share receipt and Repeat transfer, and the failed, refunded and cancelled states. Not built: Cancel transfer and Show QR code while waiting (need payment expiry and a cancel endpoint).

# Send money build plan

Cards: `CustomerSend`, `CustomerSendWeb`, `CustomerTransferDetail`, `CustomerRecipients`, `CustomerKyc`, `CustomerLimits`, `SendAmountField`, `RateLine`, `ReceiptTransfer`, `EmailTransfer`, `PushTransfer`, `OfficeTransferDetail`, `OfficeRatesApproval`, `OfficeLimits`, `OfficeSendOps`, `OfficeRecipientsAndBlocks`, `OfficeTransactions`, `OfficeRates`, `OfficeKyc`. Decisions: `design-system/guides/80-decisions.md` (Send money section). All rates, fees, limits, deadlines and provider ids on cards are samples.

Principles: Send is money movement. Ship in small steps behind flags, keep the checkout and payment contracts frozen for installed apps, no provider names on customer screens, every money mutation idempotent and audited.

## Gaps (card vs built)
| Area | Built | Missing |
| --- | --- | --- |
| Transfer timeline | 3 stages in `mobile/app/pay/[transactionId].tsx` | 4 stages, awaiting-payment deadline with rate lock, refunded and cancelled states |
| Transfer detail | none as a screen | detail screen, share receipt, repeat transfer, report a problem |
| Limits | none | per-level monthly limits, usage, reset date, limit errors in Send |
| Rates | list and markup in Office | four-eyes approval, history, stale-rate block, customer paused state |
| Notifications | emails en/es/fr/ru, exclamation-mark copy | zh and pt, split events (received, sent, delivered, failed, rate expiry), customer push |
| Receipt | uploaded proof files only | generated receipt (screen, PDF, image) |
| Office | transactions list | transfer detail page, retry/refund/mark delivered with reasons, attempts, provider health, blocklist, limits editor, Send ops queues |
| Web | partial | `CustomerSendWeb` desktop flow with top nav and side panels |

## Work packages
S0. Data: tables for `transfer_events`, `transfer_attempts`, `rate_proposals`, `rate_history`, `kyc_limits`, `kyc_limit_exceptions`, `kyc_usage`, `send_blocks`; migrations after API WP0. Exit: chain applies twice on real Postgres; RLS tests.
S1. Rates: proposal and approval API (proposer cannot approve), history append-only, stale-rate guard in quote and create-transfer (503-style paused response), Office Rates and RatesApproval. Exit: four-eyes test, stale corridor refuses new transfers, existing in-flight transfers unaffected.
S2. Limits: `kyc_limits` read by quote and create, `kyc_usage` monthly, exception with expiry, Office Limits (compliance and super_admin write), `CustomerLimits`. Exit: boundary tests (exactly at, one minor unit over, across month reset).
S3. Transfer lifecycle: event timeline, 10-minute payment window and rate lock read from settings, refund state, attempts and retry, mark delivered, notes; Office TransferDetail and SendOps; customer TransferDetail on native and web. Exit: retry idempotency (double click creates one attempt), refund by role, timeline matches provider webhooks in replay tests.
S4. Customer Send UI: `SendAmountField`, `CorridorPicker`, `RateLine`, review, waiting screen, failure states; native first, then `CustomerSendWeb`. Exit: simulator and browser walk of every state on the card with the fake provider.
S5. Notifications and receipts: split email events with logo, six languages and the recipient time zone, push (Expo) after customer push infrastructure (API WP8), generated receipt (PDF and image). Exit: golden-file tests per event and language, receipt totals equal ledger.
S6. Blocks and recipient lookup: `send_blocks`, checks in create-transfer, Office page, logged reveal of masked data. Exit: blocked sender or recipient is refused with a neutral message and one audit row.
S7. Operations: provider health, maintenance switch (API-level maintenance guard), queue counts, alerts to Telegram or email on stuck payments and failed payouts. Exit: induced provider failure raises an alert and the queue shows it.

Order: S0, then S1 and S2 in parallel, then S3, S4 and S6, then S5 and S7. S3 depends on Office permissions (API WP1).

## Do not build yet
Rate alerts, sanctions screening, recipient name verification with banks, any number from the cards, provider names in customer copy.

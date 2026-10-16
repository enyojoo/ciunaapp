# EmailTransfer

## Purpose
The emails a customer gets as a transfer moves from payment to delivery, or fails, or its rate runs out.

## Anatomy
EmailLayout frame: logo, title, one sentence, label and value block, one button, footer with why they got it and the support address. Subject shown above each email.

## States
Payment received; sent; delivered; failed with refund note ("Your money is safe", refund amount and time frame, check-the-details notice); rate-expired reminder; the delivered email in Russian and in Chinese.

## Rules
Subjects name the event and the reference. Buttons name the action: View transfer, Track transfer, View receipt, Get a new rate. No exclamation marks on money or status. Times show their zone. No provider names; the method is Bank transfer (SBP), SBP QR or Pay online. The expired-rate reminder is sent once. Every email also ships a plain-text part with the same words. Copy lives in locale files for every supported language.

## Upgrade
Differs from the built app (`api/lib/email-templates.ts`, `api/locales/*/emails.json`): built are pending, processing, completed, failed and cancelled transfer emails with a details block, but the copy uses exclamation marks ("Transfer Completed Successfully!"), has no separate payment-received, sent and delivered steps, no refund amount on failure, no rate-expired reminder, and there is no Chinese email locale (en, es, fr and ru exist). New: the five emails here and the zh locale.

## Code
`api/lib/email-templates.ts`, `api/locales/*/emails.json`

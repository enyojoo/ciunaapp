# CustomerSendWeb

## Purpose
Send money on desktop web (app.ciuna.com): the same flow as the phone, using the width for a persistent quote and side panels.

## Anatomy
Top nav (logo, Home, Send, Activity, search, cart, Account) as decided for the customer web shell. Stepper: Amount, Recipient, Review, Pay. Two columns: form on the left, 380px aside with the quote plate (and the monthly limit) on the right. Recipients and Add recipient open in a 460px side panel over a scrim; the transfer detail opens the same way from Status and Activity.

## States
Amount; amount with validation (limit banner with Verify identity, error under the lane, quote hidden, Continue disabled); recipient choice in the panel; add recipient with field errors; review with pay methods (SBP QR, Bank transfer, Pay online) and the locked-rate quote; SBP QR waiting with the exact amount and deadline; completed status with the transfer detail panel.

## Rules
The quote never moves between steps. Errors say what to fix and sit under the field. Panels close with Escape and the close button and keep the step's data. Methods are listed by name and only those enabled for the pay currency. No provider names. Same fee numbers and wording as the phone.

## Upgrade
Differs from the built app (`web/app/send/page.tsx`, `web/app/send/[id]`, `web/app/pay/[transactionId]`): the multi-step flow, recipient dialog, currency popover and status page exist. The top-nav shell, persistent aside, recipients and transfer detail as side panels, the monthly limit plate, the SBP QR layout and the lock countdown are New.

## Code
`web/app/send/page.tsx`, `web/components/send/*`

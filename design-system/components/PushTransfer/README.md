# PushTransfer

## Purpose
How transfer events reach a customer who is not looking at the app, and how they appear when the app is open.

## Anatomy
Push: app name, time, title (the event), one-sentence body; Android may add one action. In-app toast: icon, title and one line at the top of the screen, ink background, or destructive for a failure.

## States
iPhone lock screen with delivered, sent and payment received; Android shade with transfer failed (View transfer), rate expiring (Pay now), rate expired (Get a new rate) and refund sent; Russian lock screen; in-app toast for delivered; in-app toast for payment not received.

## Rules
Title is the event; body is one sentence; the words match the email. Tapping opens that transfer. At most four pushes per transfer plus the optional rate-expiry warning two minutes before the window closes. Amounts appear on the lock screen; account numbers and addresses do not. The toast shows only while the app is open, replaces the push, auto-dismisses in 5 seconds. A failure says the money is safe when it is. Respect notification settings and quiet hours. No provider names, no emoji, no exclamation marks.

## Upgrade
New. The app registers push tokens for other events but sends no transfer notifications today; the rate-expiry warning needs the quote expiry from the API.

## Code
Customer app notifications and toast provider (`mobile/components/toast-provider.tsx`)

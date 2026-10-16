# Design decisions

Resolved so build work can start. Change a decision here first, then the tokens and cards.

## Colour
- Controls use `--primary` `#CD4B0E` with a white label (4.56:1). Hover `--primary-hover`. Orange text and links use `--primary-text` `#C2410C`.
- The logo orange `--brand-primary` is for the logo, illustrations and large decorative areas only. No small text and no control fills.
- Every customer, Seller and Office control follows this. The dark-ink-on-orange idea from the first plan is dropped.

## Placeholder numbers (shown on cards, not facts)
All figures below are examples drawn on cards. Each is configured in Office or the database and must not be hard-coded in an app.
- KYC limits per month (level 1, 2, 3): drawn as ₽50,000, ₽600,000, ₽2,000,000. Source of truth: Office compliance settings.
- Referral tiers 0.5%, 0.75%, 1% and payout minimum: Office referral settings.
- Launch commissions food 8%, mart 6%, experts 12%, withdraw fee 1%: Office fee rules (money settings for hold days and minimum payout).
- Support reply times: shown only if Office sets support hours; otherwise no promise is drawn.
- Telegram link expiry 10 minutes and team invite expiry: configuration constants set in the API.
- Names such as Ada K., Grace T. and "Block appeals" are sample data.

## Product choices
- Seller phone nav has 5 items: Home, Orders, Messages, Catalog, More. Earnings, Reviews, Profile and Settings live under More. Expert sellers see Services and Bookings in place of Catalog and Orders.
- Customer tab is titled "Account" in the design cards; the built app says "More". Keep "More" until a copy review, then change both.
- Payout destinations are SBP or a bank account. Card numbers are not accepted. "Withdraw via Ciuna Send" shows as Coming soon.
- Providers are named only in Office. Customer and Seller screens say payment method names only (bank transfer, SBP QR, pay online).
- Biometric prompts use the `scan-face` icon until a fingerprint glyph exists.
- Features marked "New" in a card's Upgrade section are proposals. Build them only through the plan in `docs/design-to-build-plan.md`.

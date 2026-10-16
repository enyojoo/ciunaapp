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

## Resolved product decisions (replace every "decision needed" in `docs/build-plan/*`)

Defaults chosen for Ciuna's interest: protect money and customers first, launch small, make every number configurable, defer anything that needs a vendor or legal sign-off. A value here is the seed; Office or settings own it afterwards.

### Customer app
1. **Delivery model:** sellers set pickup details and delivery zones (city, district, fee) in Seller; Office can override per merchant. Minimum order and delivery fee come from the zone. A zone the buyer's address is not in shows "This store does not deliver to your address".
2. **Opening hours:** a closed store is browsable but checkout is blocked with "Opens 9:00". No pre-orders at launch.
3. **Gallery and variants:** multi-image gallery (up to 6) yes; variants no, deferred.
4. **Report a problem:** opens a support request pre-filled with the order. No separate refund flow; refunds are decided by Office (finance) from the order.
5. **Support:** launch with a request form, email and Telegram, handled in Office. No live in-app chat and no promised reply times unless Office sets support hours. The conversational assistant is deferred; keep the existing errands queue.
6. **Account deletion:** blocked while there are open orders, pending transfers or a referral balance. Otherwise personal data is erased or anonymised; ledger, transfer and tax records are kept as the law requires and the dialog says so in plain words (legal reviews the text).
7. **KYC:** three levels (verified email and phone; government ID; ID plus address proof). Limits per level are Office compliance settings; seed values are conservative and compliance must confirm before launch. Rejection uses templated reasons.
8. **Expert bookings:** the expert must accept (Awaiting, then Confirmed). The customer is refunded in full if the expert declines or does not reply in 24 hours. Customer cancellation is free until 24 hours before the session. The meeting link is entered by the expert.
9. **Chat quick replies:** seller-only. Customers type free text.
10. **Desktop Home greeting and referral plate:** not built.
11. **Favourites:** live under More and as hearts on cards, not in Activity.
12. **Web UI kit:** `web/` adopts `@ciuna/ui-web` for all new and touched screens; old `web/components/ui/*` are removed as screens migrate. `web/locales/*` is deleted once `packages/shared/src/locales` is the only source.
13. **Header:** search is a field on Home and in the header on desktop; Favourites is in More.
14. **Customer web desktop shell:** a top nav (logo, search, cart, Account), not the 224px sidebar. Update the built web shell to match the cards.
15. **Tab name:** "More" everywhere; the cards' "Account" is corrected.

### Seller
1. **More:** a full page on phones (deep links and back button work), a sidebar on tablet and desktop. The business switcher and language picker are sheets.
2. **Top-bar search on desktop:** not built; show account menu and notifications only.
3. **Low stock:** default threshold 5, editable per product.
4. **Documents expiring:** warn 30 days before expiry (Office setting).
5. **Expert credentials and spoken languages:** build, reviewed by Office, shown with the verified badge. Intro video is deferred.
6. **Email time zone:** show the recipient's time zone with its abbreviation, and for bookings show both zones. Add `time_zone` to users, defaulting from the browser or the service zone.
7. **Ciuna Send payouts:** stay "Coming soon" until manual payouts have run cleanly for a full month with real merchants.
8. **Web push:** build after launch; Seller alerts at launch are email and Telegram only, and the copy says so.

### Office
1. **Roles** (11 permissions, five roles). `super_admin`: everything including roles and settings. `ops`: merchants, listings, orders, bookings, experts, catalog, reviews; no money movement. `finance`: payouts, fees, refunds, money settings, rates, export; read merchants. `compliance`: KYB, KYC, compliance cases, audit; read users. `support`: read everything except payout details and provider data; add notes; cancel orders under a cap; no refunds. Every denial hides the control and the API returns 403.
2. **SLA targets (seeds):** merchant application 24 h, listing review 12 h, payout 48 h, KYC 4 business hours, support request 1 business day. Breaches show "Over by". Office can change them.
3. **Listing review scope:** new listings, and edits to title, images, description or category, send a live listing back to review. Price, stock and sold-out edits do not. Templates: prohibited item, unclear photos, wrong category, missing information, price or description misleading, contact details in listing, duplicate listing, other (free text).
4. **Compliance cases and sanctions screening:** deferred; launch relies on KYC and KYB review plus the audit log. Choose a screening provider after the pilot.
5. **Booking disputes:** no separate workflow; use the order exception and support request flow.
6. **Referral block:** already-paid rewards stay; pending rewards are cancelled.
7. **Payout reveal and providers:** only finance and super_admin see payout details and provider names; every reveal is logged.
8. **Dependencies:** add `cmdk` and `@ciuna/ui-web` to Office.

### Money and platform
- Seed settings: hold 3 days after completion for goods and 2 days after the session for experts; minimum payout ₽1,000; payout fee 0% at launch (built, off); commissions 8% food, 6% mart, 12% experts until the pilot data says otherwise. The "1% withdraw fee" on cards is an example only and should be shown as 0 until finance sets one.
- Payouts keep the existing steps (approve, then mark paid with a reference). No extra second-person rule at launch.
- Chat translation: Azure AI Translator (supports en, ru, fr, es, zh-Hans, pt) behind a provider interface; the original text is shown if the provider fails. Needs `AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION` and endpoint in the API env. Push: Expo push for native, web push after launch.
- Maintenance mode is enforced in the API for all clients; money routes return 503 and apps show a banner.
- PIN stays a local device lock for launch; a server PIN needs its own security review.
- Rate limits at launch: auth 10/min per IP, chat 30/min per user, search 60/min per user, checkout 10/min per user, uploads 20/min per user.

### Send money (added)
- Finance changes rates and markups directly. No second approver. Every change is audited with who, old value, new value and a short note, and values outside the allowed bounds (markup 0% to 5%, no negative spread) are refused. A stale corridor rate blocks new transfers on that corridor and shows a plain "paused" state to customers.
- Limits are edited by compliance and super_admin only; finance sees them read-only.
- Compliance has read-only access to Send operations.
- All rates, markups, fees, limits and provider ids on Send cards are sample data.

### Final seeds and deferrals (no outside sign-off needed to build)
- All numbers are Office-editable settings; the values below are the launch defaults and ship as seeds in a migration. Nobody has to approve them before the build; Office changes them later without a deploy.
  - Send limits per month by KYC level: level 1 ₽50,000, level 2 ₽600,000, level 3 ₽2,000,000. Per transfer minimum ₽500.
  - Commissions: food 8%, mart 6%, experts 12%. Payout fee 0%. Minimum payout ₽1,000. Hold 3 days (goods) and 2 days (experts).
  - Referral: rewards 0.5%, 0.75%, 1% by tier on the transfer fee, minimum referral payout ₽1,000.
  - SLA, rate limits, expiries as listed above.
- Telegram alerts are built but stay off until `TELEGRAM_BOT_TOKEN` is set; at launch Seller alerts are email only. Create the bot later with @BotFather.
- Provider accounts are obtained in parallel to the build; code reads keys from env and every provider call sits behind an interface with a fake for tests: Azure AI Translator, Expo push, SES (existing), YooKassa and Bitbanker (existing).
- Account deletion text (final, English; translate to the other five languages with the standard strings process):
  - Title: "Delete your account?"
  - Body: "We will erase your profile, saved recipients, addresses and favourites. We must keep records of your payments and transfers for 5 years because the law requires it. They stay on file without your profile details and are used only for legal and security needs. You cannot undo this."
  - Blocked: "You can't delete your account yet. Finish or cancel open orders and transfers and withdraw or use your referral balance, then try again."
  - Buttons: "Delete account" (destructive), "Keep my account".
  - Retention is a setting (`retention_years`, default 5) so it can follow legal advice without a code change.

### Marketplace payment (corrected)
- Marketplace orders (Food, Mart, expert bookings) are paid in YooKassa's payment frame, not in a method list drawn by Ciuna. Web uses the embedded widget; native uses the YooKassa SDK (`gatewayMode` embedded or native in `mobile/components/marketplace-checkout.tsx`). The customer picks bank card, SBP or another method inside that frame.
- Our checkout therefore has no "Pay with" list. The last step shows the order summary, the total in RUB and one primary button "Pay ₽X" that opens the payment frame. After it closes we show the states: opening, waiting for confirmation ("Checking payment. Please don't pay again."), paid, failed with "Try again", cancelled. The method chosen is shown afterwards only as the name YooKassa returns (for example "Bank card ····4242" or "SBP").
- Customer copy still avoids naming the provider in our own text ("Pay securely", "Payment"); the frame carries its own branding, which is expected. Office may name YooKassa.
- Send is different: its payment methods (SBP QR, bank transfer) are drawn by Ciuna and stay as designed.
- Design cards to change: `MarketCheckout`, `OrderSummary`, `ExpertBooking` (pay step), `Cart` (no methods), `ProductPage` and `CustomerTransactions` only if they show a method list.

- The payment frame is a full screen (its own page with a minimal Ciuna header: a close button and the title "Payment"), not a bottom sheet or drop-up laid over the order summary. On web it fills the content area of the checkout page. Closing it returns to the Review step; confirmation states then show on our own screen.

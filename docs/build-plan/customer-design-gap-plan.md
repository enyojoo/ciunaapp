# Customer app vs design system: audit and plan to close the gaps (2026-10-19)

Six read-only audits compared every customer card (`design-system/components`) with the Expo app code and screenshots. Raw findings with file and line: `docs/build-plan/audit/audit-A.md` to `audit-F.md`. Deliberate owner decisions (`80-decisions.md`, `design-reconciliation-customer.md`) were not counted as gaps. Nothing was run on a device; desktop web was judged from code. A few findings were spot-checked (refunded status tone, PIN and delete wiring).

## Answers

**Is every customer screen built from the design system?** Every screen exists and works, but only about half match their card closely.

| Verdict | Cards |
|---|---|
| Matches or mostly | CustomerHome, HomeSlider, SearchResults, Favourites, StorePage, Cart, OrderChat, ReviewFlow, ExpertProfile, CustomerTransactions, CustomerRecipients, CustomerLimits, CustomerAuth, CustomerProfile, CustomerMore, CustomerReferrals, CustomerSupport |
| Partial | FoodHome, MartHome, ProductPage, MarketCheckout, OrderTracking, ExpertsDirectory, ExpertBooking, CustomerSend, SendAmountField, CustomerPin, ReceiptCustomer, ReceiptTransfer, PushAndInApp |
| Far | CustomerTransferDetail, CustomerSendWeb, CustomerKyc, PushTransfer |

**Is it the best design and UX we can get?** No. It is a solid, consistent v1, and the money paths work, but four things hold it back: the Send flow lacks the guidance the card has (limits shown early, pay-with step, payment-waiting and failure screens); transfer detail and KYC are far from their cards; the colour and touch-target rules in the foundations are not applied everywhere (191 hard-coded colours, 24 text sizes under 12px, many controls under 44px, low-contrast form edges); and desktop web is a stretched phone layout.

**Are all features built?** No. Missing features by area are listed below; the largest are KYC capture, transfer detail states, booking confirmation and meeting link, payment-waiting screen, desktop Send, and transfer push notifications.

## Biggest fixes (small, high value)

1. `statusTone` in `mobile/lib/transactions.ts` has no `refunded` case, so refunded transfers show "Pending" and their receipt is unreachable. One line plus a chip.
2. Product page SLA chip reads "Usually Within Ready In 30 Min" (template plus capitalise).
3. Profile still says delete is "not implemented"; More links to the real flow (`delete-account.tsx`).
4. Fetch errors show wrong states: store "not found", product "not found", cart "empty", Food and Mart "No stores yet", Home "Unavailable", recipients "empty". Each needs the shared retry state.
5. Checkout: users without a profile phone have no contact name or phone fields; zero-value fee rows show; no "checking payment" state.
6. Verification gate in Send is a toast and redirect, not the card's "Verify identity" step.
7. Foundations: form edges use hairline, not `input-edge`; status colours bypass tokens; toast and chip hex colours; no reduced-motion.

## Plan

Each phase ends with tsc, locales, design checks, tests, new screenshots and a commit.

### Phase A: foundations (affects every screen)
- Add missing tokens to `theme.ts` (control and sheet radius, 12px caption, star empty, scrim, card edge, shadow presets, motion) and replace the 191 hex literals, starting with the worst files (`tile`, `home-slider`, `order-status-header`, `marketplace-pay-step`, `auth-chrome`, `yookassa-checkout-widget.web`).
- Form edges to `input-edge` (field, switch off-track, secondary button); web focus ring (3px primary) including on `Pressable` controls; status colours to the `*-text` pairs with icons; toast restyle (ink with icon, replace instead of stack, in-app toast for foreground push).
- Touch targets to 44px (product and cart steppers, CTAs, filter chips, chat chips, toast action); text under 12px raised; icon-only buttons labelled (recipients, referrals); VerifiedBadge label on a wrapper so native reads it; reduced-motion.
- One date helper that always names the time zone; one in-page offline line with cache time, replacing the global pill where data is cached.
- A shared load-error state used by every list and detail screen (fixes finding 4).

### Phase B: browse and buy
- Home: retry on failed load; 6-tile skeleton; wrap slider text instead of truncating; fix first slide link. Confirm the card's "Everything you need in Russia" line with the owner.
- Food and Mart: orange 56px cart bar; error and empty states with "Back to Home"; closed store shows opening time; desktop store grid and header cart pill.
- Store: retry state; desktop side column. Product page: price above description, total on the Add button, sticky bar, desktop gallery size, SLA chip fix, rating and city when the API has them.
- Cart: sticky Checkout, 44px steppers, undo toast on removal, remove the blank gap, delivery line, whole-currency amounts, "Add more" to the store.
- Checkout: contact name and phone fields, address-required error, no zero rows and a Subtotal row, "Checking payment" state that disables paying again, hide the pay-method tabs per the decision.
- Order: retry and skeleton, "Complete payment" banner at the top, heading "Order progress" wording, support link to a pre-filled `/support/new`, remove the duplicate raw event list, item photos, unread dot on Activity rows, order strip with items, total and status, closed-chat support link.
- Reviews: store name and order number in the sheet, Close on the locked sheet, percentages in the bars.

### Phase C: transfers (Send, detail, receipts, KYC)
- Send: Min and Max hint under the amount and inline limit errors with "See limits"; review step with Pay-with rows, masked recipient with Change, sticky "Pay ₽X"; verification gate as an in-flow step; skeleton and FX retry. Limits screen: opened-from-Send banner, offline banner, reached-state date.
- Transfer detail: status badge and "what happened to your money" headline, four-step timeline, masked account, payment plate with reference, Report a problem, sticky Share and Repeat, refunded, failed-and-refunding, awaiting-payment states, fee percent, rate precision, translate the Bitbanker block.
- Receipts: time zone on dates, Items subtotal, PDF logo and A4 layout, refunded badge colour, refunded transfer explanation, row order per card.
- Recipients: tappable rows, masked numbers, field hints and inline errors, delete error reason.
- KYC hub: document rows with status badges and Your-limit card, rejected and in-review states, address as radio list.
- Needs backend first (listed under Backend): payment expiry and cancel endpoint, per-stage transfer timestamps, refund state and decline reason, multi-file KYC submissions with templated rejection reasons, a delete-recipient response that says why.

### Phase D: experts and account
- Experts directory: list-row layout per card (or keep tiles and record the decision), headline and languages, fixed language chips, offline line.
- Expert profile: next available with "Notify me" (needs endpoint), service cards with online or in-person, credential icons, share, skeleton. Booking: richer time-zone card with offsets, hold line, notes helper and counter, return to slot step on a taken slot, retry on slot fetch failure, confirmation and meeting-link screens (meeting link needs the order payload to carry it).
- Auth: error under the password field, live password rules (8 characters), terms and Privacy link, language chip with its own name.
- PIN: avatar and name on unlock, biometric key, 72px round keys, red dots on error, re-lock after idle, a Security screen to turn the PIN off (decision: PIN stays optional).
- More: neutral icon tiles, KYC chip states, language sub-label, real app version. Profile: delete link to the real flow, phone validation, sticky edit bar, desktop two columns. Referrals: retry, paused-programme state, reward window date, inline withdraw errors. Support: skeleton in thread, configurable hours and Telegram link.

### Phase E: notifications and desktop
- Transfer pushes (new "transfers" category, six languages, at most four per transfer), booking reminder push, quiet hours, action buttons, Orders badge counting required actions.
- Desktop web: top navigation as the cards and decision 14 specify (currently a left sidebar; confirm which the owner wants), three-column directory, max-width search, desktop Send per `CustomerSendWeb` (stepper, persistent quote aside, side panels).

## Backend and data needed (build with the phase that uses it)
- Transfers: payment expiry, cancel-transfer endpoint, paid/sent/refunded timestamps, refund state, decline reason.
- KYC: multi-file submissions, templated rejection reasons.
- Marketplace: vendor delivery fee and time "from" values, vendor rating and city on products, fulfilment cards data, payment method name on orders, refund amount and timeframe, item photos in order payload, expert in-person flag, notify-me endpoint, meeting link on bookings, cuisine and tag fields for Food and Mart chips, address filter for Mart stores.
- Support: screenshot attachments (upload endpoint and column), Office-set hours.
- Home: Office-managed slides (new table and endpoint).
- Card for `PushTransfer`: transfer hooks, rate-expiry scheduler.

## Owner decisions needed
1. Desktop navigation: keep the left sidebar or move to the top navigation the cards specify.
2. Experts directory: card list rows, or keep the image tiles.
3. Food and Mart chips: keep product categories, or add cuisines and tags set by sellers or Office.
4. Home slides: stay static, or become Office-managed.
5. Support attachments and AI chat: attachments yes or no (AI is already out).
6. Dark mode: stay light only.

## Order of work
Phase A first (it changes every screen), then C (money paths), B, D, E. Phases B to D can be split into separate sessions per screen group once A lands.

## Housekeeping found by the audits
- Stale READMEs: StorePage (Share built), OrderTracking (status header, place card, times, desktop chat panel built), receipts (PDF built); the reconciliation note saying search highlighting is not built.
- `As built` screenshots exist for five cards; the HTML previews of those cards remain the earlier layout.

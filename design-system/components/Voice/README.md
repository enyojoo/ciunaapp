# Voice

## Purpose
How Ciuna writes: the content rules every string follows, with real do and don't pairs.

## Anatomy
Tone (plain, calm, specific, warm not cute); casing; button verbs; confirmation questions; error messages; money-state statements; provider ban; no emoji; date and time format; seller vocabulary; multi-language writing.

## States
Message types: confirmation (direct question), success (what happened, calm), error (what to fix), money state (where the money is and when), empty (what is missing and how to add it).

## Rules
- Sentence case for titles, buttons and tabs; product names keep capitals.
- Buttons name the action: "Reject order", never "OK" or "Submit".
- Errors say what to fix: "Enter a 10-digit phone number", not "Invalid input".
- Say what happens to the money and when. No exclamation marks on money or status.
- No provider names (YooKassa, Bitbanker) on customer or seller screens, email, push or errors. Office only.
- No emoji in product UI.
- Dates: "Sep 24" in lists, "Sep 24, 2026 • 2:14 PM" in details, time zones on cut-offs and bookings (viewer's and expert's).
- Words: seller, store, expert, profile, order, booking, payout, Ciuna Seller.
- Every string in en, ru, fr, es, zh, pt; whole strings with placeholders; room for 40% longer text.

## Upgrade
Audit for remaining "merchant", "vendor", "OK" and provider names in customer and seller copy; move date formatting to the shared formatter.

## Code
`packages/shared/src/i18n/`, `packages/shared/src/format-date.ts`

# StatusBadge

## Purpose
One word status in one colour pair, with an icon, so state is readable at a glance and without colour.

## Anatomy
Pill (`badge`): 14px icon + one word (two at most), 12px semibold. Sizes: small 22, default 26, large 32. Dot variant: 8px dot + word in the tone's text colour, for dense lists. Tone icons: check (success), clock (warning), triangle-alert (destructive), minus (neutral).

## States
Tones map by word, never by caller:
- Success: Completed, Paid, Live, Verified, Accepted, Delivered, Confirmed, Approved, Published, Active, Released, Resolved.
- Warning: Pending, Preparing, In review, New, Awaiting payment, Awaiting pickup, Processing, Out for delivery, On hold.
- Destructive: Failed, Rejected, Overdue, Suspended, Declined, Disputed, Reported.
- Neutral: Draft, Paused, Cancelled, Refunded, Archived, Hidden, Expired, Closed.
Areas: order, booking, payout, seller/merchant application, review, payment each use a subset in lifecycle order.

## Rules
- Surface + text pairs only (each at least 4.5:1). Solid fills are for emphasis, with a white label.
- Orange is never a status; `badge-primary` is for labels like "Featured".
- Never colour alone: always the word, plus the icon on pills.
- Sentence case, one word where possible, never truncated. Same word in every surface; translated in all six languages.
- The badge goes at the end of the row after the amount; on narrow screens it moves under the title.

## Upgrade
Replaces the ad-hoc status colours in web and mobile `status-chip` and Office tables. Unknown words fall back to neutral and log a warning.

Expo: `Badge` in `mobile/components/ui/badge.tsx` (success, warning, danger, neutral, primary) with an optional leading icon. `StatusChip` keeps the transaction status mapping and should move onto `Badge`.

## Code
`packages/ui-web/src/status-badge.tsx`

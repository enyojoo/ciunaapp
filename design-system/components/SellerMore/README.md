# SellerMore

## Purpose
The More destination in Ciuna Seller: everything a seller needs that does not fit in the bottom nav, filtered by the business type and the signed-in person's permissions.

## Anatomy
- Page (phone, built route `/more`): page header "More" with the signed-in email, then two groups of rows in cards: Business (Store profile or Expert profile, Reviews, Verification and documents, Pickup and delivery or Availability, Earnings, Payout methods) and Settings (Alerts, Team). Below them a card with Language (a select showing the current language) and Sign out.
- Row: 20px icon, label, a right-hand hint (rating, available balance, default payout method, people count; only when the data exists) or a status badge, chevron. Minimum height 50px; the whole row is the tap target.
- Sheet (phone, not built yet): the same rows in a bottom sheet opened from the More item in the bottom nav, with the email in the header. It never shows a second set of rows.
- Language sheet (not built yet; the page uses a select): six languages in their own script, the current one checked.
- Tablet (820): sidebar already lists Earnings and Reviews, so those rows leave More. The list stays at 520px and is not stretched.

## States
Store owner; hints missing; expert owner as a sheet (not built); staff (Reviews, Pickup and delivery, Alerts); finance (Reviews, Earnings, Payout methods, Alerts); language sheet (not built); Russian with wrapping labels and truncated hints; tablet owner; tablet staff. Verification shows Verified, In review, Rejected or Action needed as a badge, never colour alone.

## Rules
- A row the role cannot use is not drawn. Alerts, Language and Sign out are always present.
- Permissions follow `seller/components/shell/nav.ts`: Profile and Verification need profile and documents; Earnings needs earnings; Payout methods needs payouts; Team needs team; Reviews follows orders.
- Every sidebar destination must be reachable on a phone: whatever is not in the bottom nav lives here.
- Sign out is a plain row, not red. It returns to the sign-in screen without a confirmation, because nothing is lost.
- Hints are short and truncate with an ellipsis; labels may wrap to two lines. Language changes at once and is saved to the account.
- Seller never shows provider names: "SBP · Sberbank" names a bank, not a payment provider.

## Upgrade
**Built** (`seller/app/(shell)/more/page.tsx`):
- A full page at `/more` with Business and Settings groups, Earnings and Reviews rows (phone only; from 768px the sidebar carries them), right-hand hints, the Verification badge and a Language select above Sign out.
- Hints are drawn only when their data exists: rating (`4.8 ★`), the largest available balance, default payout method with last digits, team size. Never a placeholder.
- Rows follow permissions; Alerts, Language and Sign out are always present.

**Differs** (product wins; the card now shows the product):
- Hints: rating is `4.8 ★` (no review count), balance has no "available" word, Alerts, Pickup and delivery and expert rows carry no hint. An extra frame shows the page with hints missing (loading or no data).
- Language is a native select, not a sheet; More is always a page, not a sheet over the screen.
- Staff keep Pickup and delivery (catalog permission); finance sees Reviews (orders permission), Earnings and Payout methods and a Home, Orders, More bottom nav.
- Group labels are sentence-case headings, not uppercase eyebrows.

**Not built yet** (marked in the frame captions):
- More as a bottom sheet from the nav (expert frame).
- Language as a sheet of six languages in their own script.

## Code
`seller/app/(shell)/more/page.tsx`, `seller/components/shell/nav.ts`, `seller/components/shell/app-shell.tsx`

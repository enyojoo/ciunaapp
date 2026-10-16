# SellerMore

## Purpose
The More destination in Ciuna Seller: everything a seller needs that does not fit in the bottom nav, filtered by the business type and the signed-in person's permissions.

## Anatomy
- Page (phone, built route `/more`): page header "More" with the signed-in email, then two groups of rows in cards: Business (Store profile or Expert profile, Reviews, Verification and documents, Pickup and delivery or Availability, Earnings, Payout methods) and Settings (Alerts, Team). Below them a card with Language (a select showing the current language) and Sign out.
- Row: 20px icon, label, a right-hand hint (rating, balance, payout method, people count) or a status badge, chevron. Minimum height 50px; the whole row is the tap target.
- Sheet (phone): the same rows in a bottom sheet opened from the More item in the bottom nav, with the email in the header. It never shows a second set of rows.
- Language sheet: six languages in their own script, the current one checked.
- Tablet (820): sidebar already lists Earnings and Reviews, so those rows leave More. The list stays at 520px and is not stretched.

## States
Store owner; expert owner as a sheet; staff with orders and messages only (Reviews, Alerts, Language, Sign out); finance staff (Earnings, Payout methods, Alerts); language sheet; Russian with wrapping labels and truncated hints; tablet owner; tablet staff. Verification shows Verified, In review, Rejected or Action needed as a badge, never colour alone.

## Rules
- A row the role cannot use is not drawn. Alerts, Language and Sign out are always present.
- Permissions follow `seller/components/shell/nav.ts`: Profile and Verification need profile and documents; Earnings needs earnings; Payout methods needs payouts; Team needs team; Reviews follows orders.
- Every sidebar destination must be reachable on a phone: whatever is not in the bottom nav lives here.
- Sign out is a plain row, not red. It returns to the sign-in screen without a confirmation, because nothing is lost.
- Hints are short and truncate with an ellipsis; labels may wrap to two lines. Language changes at once and is saved to the account.
- Seller never shows provider names: "SBP · Sberbank" names a bank, not a payment provider.

## Upgrade
Built in `seller/app/(shell)/more/page.tsx` as one flat card of rows. Differences:
- Earnings and Reviews are not in the built list, and on phones the bottom nav does not reach them either (see SellerShellStates). They are New here, with Business and Settings group labels.
- Right-hand hints and status badges are New; today rows have only icon, label and chevron.
- Built has no Settings row; Alerts and Team are routes under `/settings`. The groups simply label them.
- The sheet version is New (today More is always a full page).
- The tablet rule that More drops rows already in the sidebar is New.

## Code
`seller/app/(shell)/more/page.tsx`, `seller/components/shell/nav.ts`, `seller/components/shell/app-shell.tsx`

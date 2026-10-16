# SellerShellStates

## Purpose
The frame around every seller screen, and how it changes with screen width, the seller's role, the number of businesses and the business status.

## Anatomy
- 768px and up: 248px sidebar with the Ciuna logo, nav (Home, Orders, Messages, Catalog, Earnings, Reviews, More) and the business switcher at the bottom (business, type and role).
- Under 768px: top bar (business switcher, menu button) and a bottom nav of Home, Orders, Messages, Catalog and More. Content has 16px gutters and clears the nav.
- More: Store profile, Reviews, Earnings, Verification and documents, Pickup and delivery, Payout methods, Alerts, Team, Language, Sign out.
- Business switcher: a list of the user's businesses with the current one checked (a menu on desktop, a sheet on phones).
- Status banner above the page content: draft, in review, rejected, suspended, paused.

## States
Desktop expanded; switcher open; staff with limited permissions (nav items the role cannot use are removed, the switcher shows no chevron with one business); tablet 820; phone with More sheet; phone with switcher sheet; finance role reaching a page it cannot use ("You don't have access to orders"); paused and in-review banners in context.

## Rules
- Items without permission are hidden, not disabled. The bottom nav takes the first four allowed destinations plus More.
- Every destination in the sidebar is reachable on phones: whatever is not in the bottom nav lives in More.
- Banners never stack; the most severe one wins.
- 48px minimum targets in the bottom nav and sheets.

## Upgrade
Built in `seller/components/shell/` (`app-shell.tsx`, `nav.ts`, `merchant-switcher.tsx`) and `seller/app/(shell)/more/page.tsx`. Differences:
- The built More is a full page (`/more`), not a sheet; the design shows a sheet from the bottom nav. Either way it must include Earnings and Reviews: on phones the built nav and More page do not reach them.
- The built switcher is an invisible native select laid over the row; the design shows a styled list so the current business and role are visible. Keep the native select on phones if preferred.
- The 64px desktop top bar in `guides/30-seller.md` (search, notifications, account) is not built and is not drawn.
- The no-access screen exists only for orders today; use the same screen for any section the role cannot open.

## Code
`seller/components/shell/app-shell.tsx`, `seller/components/shell/nav.ts`, `seller/components/shell/merchant-switcher.tsx`

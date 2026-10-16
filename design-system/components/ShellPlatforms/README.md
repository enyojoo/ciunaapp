# ShellPlatforms

## Purpose
A one-page map of which surface uses which shell, at which widths, with which navigation, and what the surfaces share and do not. Read it before drawing a screen or starting a build, to pick the right frame.

## Anatomy
- Four surface rows, each with a schematic at phone, tablet and desktop widths: Customer native (`mobile/`), Customer web (`web/`), Ciuna Seller (`seller/`) and Office (`office/`). Each row names the code folder, who uses it and what changes at each width. Dashed frames mean "not built" or "not designed for".
- At a glance table: where the shell changes, nav pattern, type, languages, whether providers are named, install.
- Breakpoint ruler (sm 640, md 768, lg 1024, xl 1280) with a band per surface.
- Shared and not shared columns, and the token flow from `tokens.json`.

## States
Phone, tablet and desktop for every surface. Customer native: phone only. Customer web: bottom nav under 1024, sidebar and top bar from 1024. Seller: top bar and bottom nav under 768, 248px sidebar from 768. Office: drawer under 1024 (works, not designed for), fixed sidebar from 1024.

## Rules
- Pick the surface first. Customer screens never use Office density; Office never uses big tiles.
- Shells are per app. Do not build a shared "AppShell"; share tokens, rules and `ui-web` pieces instead.
- Phone targets are 48px; Seller content is capped so it stays readable on desktop; Office tables scroll inside their card, never the page.
- Navigation names: customer tabs Home, Transactions (Orders in the design cards), More; Seller Home, Orders, Messages, Catalog, More (experts: Bookings, Services); Office grouped sidebar.
- Only Office names payment providers; only Seller is installable.

## Upgrade
Differs from built, and open decisions:
- Customer web desktop: built is a 224px sidebar with a 64px top bar (`web/components/layout/user-dashboard-layout.tsx`). The desktop frames in FoodHome, MartHome and CustomerProfile draw a top nav. Choose one and update the other.
- Customer native on tablets: no tablet layout is built; the sidebar-from-tablet rule in the README is a design target. Expo web is not a delivery target.
- Seller content width: built max 1100px (`seller/components/shell/app-shell.tsx`); `guides/30-seller.md` says 1200. The 64px desktop top bar in that guide is not built.
- Seller install: the manifest exists (`seller/app/manifest.ts`); confirm a service worker for the shell exists before saying "offline shell" anywhere.
- Office: built sidebar is 224px with collapsible sections; the card (OfficeShell) is 232px with five fixed groups.
- `ui-web` is consumed by Seller only today; web and Office carry their own shadcn copies.

## Code
`web/components/layout/user-dashboard-layout.tsx`, `seller/components/shell/app-shell.tsx`, `office/components/layout/office-dashboard-layout.tsx`, `mobile/app/(app)/_layout.tsx`, `packages/ui-web/src/index.ts`

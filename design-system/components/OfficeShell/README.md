# OfficeShell

## Purpose

The frame every Office screen sits in: grouped sidebar, header with search and the signed-in role, and a content area. Drawn as built, with the role rules and the no-access screen.

## Anatomy

- Sidebar (224px): Ciuna mark and "Office", a Dashboard link, then five collapsible groups: Operations, Marketplace, Merchants, Finance, Settings. Each group row has a chevron (toggle) and the group link; the group holding the current page opens automatically, the others stay collapsed. Links sit indented under a hairline. Logout is pinned at the bottom.
- Count badges on work queues (Users and KYC, Transactions, Assistant, Catalog review, Applications, Payouts): the open count from `GET /api/admin/queues`. The badge turns warning and its label says "N over target" when something is past its SLA. Nothing shows until the first answer, for a queue the role cannot work, or at zero.
- Header (64px): search button with the Cmd or Ctrl-K hint, then the user's name and the role chip (Ops, Support, Finance, Compliance, Super admin) at the right.
- Search dialog (Cmd or Ctrl-K, also the Search button): input, results grouped Merchants, Orders, Payouts with icon, title and a one-line subtitle; arrows move, Enter opens. Results are limited to what the role may read.
- No-access screen: shown in the content area when the signed-in role lacks the permission for the route (longest-prefix rule): lock, "You do not have access to this page", the role named, "Ask a super admin if you need it", Back to dashboard.

## States

- Ops: no Finance group. Support: only what it may read; no counts for queues it cannot work. Finance: Finance group, no review decisions. Compliance: KYB and Audit log.
- Palette: too short (type at least 2 characters), searching, nothing found, search failed (calm message, no raw error).
- While permissions load every link shows; once loaded the links a role cannot use disappear and a group with no link disappears.
- `/fees` and `/fees/settings` never both light up (longest matching link wins).

## Rules

- A control or link the role may not use is hidden, never disabled; the API still answers 403.
- The role chip is always visible so screenshots and screen shares show who is acting.
- Count badges and the dashboard Needs action card read the same endpoint, so they always agree.
- Office is the only surface allowed to name payment providers.

## Upgrade

Built / differs / Not built yet.

- Built (and drawn): five groups with chevrons, active group opens automatically, role chip in the header at the right, count badges with over-target wording, Cmd or Ctrl-K search over merchants, orders and payouts, no-access screen, longest-prefix active link.
- Differs from the earlier card: sidebar is 224px with neutral active fill (not orange tint), header search is a button (the old card's bell and avatar are not built), the palette has no "Go to" group or footer hints, and the merchant header has no Claim button (claiming happens in the Applications queue).
- Not built yet: "Go to" page shortcuts (G then P) inside the palette, a footer of keyboard hints, notifications bell, avatar menu, Read only badge in page headers (support sees an explanatory note on the merchant page instead).

## Code

office/components/layout/office-dashboard-layout.tsx, office/components/office/command-palette.tsx, office/lib/office-nav.ts

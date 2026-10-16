# OfficeShell

## Purpose

The frame every Office screen sits in: grouped sidebar, header with global search and the signed-in role, and a content area on the paper canvas.

## Anatomy

- Sidebar (232px): Operations, Marketplace, Merchants, Finance, Settings groups; counts on queues that need work (Merchants in review, Payouts open).
- Header: global search with the Cmd-K hint, notifications, role chip, user avatar.
- Command palette (Cmd-K): grouped results (merchants, go-to pages, orders), keyboard hints in the footer.
- Content: page head, toolbar, then tables or review panels inside `.o-card`.

## States

- Ops: Merchants, KYB, Audit, Reviews, Marketplace; Finance group shows Analytics only.
- Finance: Payouts, Fees, Money settings; no review decisions.
- Support: read only; decision and money controls are removed, a Read only badge says so.
- Palette open: scrim over the page, first result highlighted.

## Rules

- A control the role may not use is hidden, never disabled without a reason.
- A whole sidebar group disappears when the role has nothing in it.
- The role chip is always visible so screenshots and screen shares show who is acting.
- Office is the only surface allowed to name payment providers.

## Upgrade

Differs from built Office: today the sidebar has collapsible Operations, Merchants, Finance and Hub sections with ad-hoc links. The card proposes five fixed groups, count badges on work queues, a role chip in the header and a Cmd-K palette with grouped results (the palette is new). Role hiding for support is already in the built layout; the finance and ops variants formalise it.

## Code

office/components/layout/office-dashboard-layout.tsx

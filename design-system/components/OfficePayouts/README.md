# OfficePayouts

## Purpose

Work the payout queue: check the method, reveal the destination only when needed, then approve, pay with a reference or reject with a reason.

## Anatomy

- Tabs: Open with count, Paid, Rejected, Cancelled; saved views (All open, Unverified method, Over 48h).
- Sticky table: Merchant, Amount, Fee, Net payable, Method with Verified or Unverified badge, Age, Status.
- Detail dialog: amounts, method, Show payout details panel, Verified switch, footer Reject, Approve, Mark as paid.
- Mark as paid dialog (reference) and Reject dialog (reason chips).

## States

- Open: age over 48h turns warning text and adds the words Over 48h.
- Detail before and after reveal; reveal writes a note to the audit log with the actor name.
- Unverified method shows a warning above the decisions.
- Empty queue: calm message.
- Roles without finance rights see the detail without the destination panel or decisions.

## Rules

- Details are never shown by default; revealing is logged.
- Paying needs a reference of at least 3 characters.
- Reject reasons are shown to the merchant verbatim.
- Office may name SBP and bank transfer.

## Upgrade

Differs from built Office: Built table does not show Verified in the list, has no saved views and no Over 48h words beside the age. Upgrade adds the verified badge per row, views and export.

## Code

office/app/finance/payouts/page.tsx, office/components/finance/payout-panel.tsx

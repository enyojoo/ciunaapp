# OfficeUsers

## Purpose

Find a customer, see their standing at a glance and block or unblock with a recorded reason.

## Anatomy

- Table: customer, country, KYC level badge, status badge, transfers, volume, last active.
- Toolbar: search by name, email, phone or ID; status, KYC level and country filters; saved views.
- Side panel: profile, KYC level with limit usage, recent orders and transfers, audit trail link, Block customer.
- Block dialog: reason chips, required note, option to email the customer, audit line preview. Unblock dialog shows the original block and asks for a new reason.

## States

- Default, selected row, hovered row, blocked customer, Level 0 customer.
- Panel open, block dialog, unblock dialog, no results.

## Rules

- Blocking needs a reason and a note and is written to the audit log with name and time.
- Blocking never cancels open transfers; the dialog says so.
- Block and unblock are for ops and compliance; support sees the panel read only.
- Status uses the shared vocabulary: Active success, Blocked destructive, Level 1 warning, Level 0 neutral.

## Upgrade

Differs from built Office: the built page uses a dialog per row with Active/Suspended toggles and no reason. Upgrade replaces it with a side panel, KYC level and limit usage, required reasons, unblock with history and saved views.

## Code

office/app/users/page.tsx

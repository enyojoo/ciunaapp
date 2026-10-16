# OfficeAudit

## Purpose

Show every state change: who did what, when and to which merchant.

## Anatomy

- Filters: merchant, entity type, action, actor; Apply and Clear; saved views.
- Table: expander, When, Actor role chip, Action, Entity, Merchant.
- Expanded row shows the details JSON; pagination with counts.

## States

- Filtered with one expanded row.
- No entries match, with advice to clear a filter.

## Rules

- Append-only: no edit or delete controls.
- Actor chip names the kind and role, never colour alone.
- Reveal of payout details appears as its own entry.

## Upgrade

Differs from built Office: Built uses raw ID inputs for merchant and actor. Upgrade uses merchant name and an actor picker, adds saved views and export.

## Code

office/app/audit/page.tsx

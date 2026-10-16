# OfficeRates

## Purpose

Let finance see and change the exchange rate and markup for each send corridor, with a clear history.

## Anatomy

- Header with Add corridor, four summary tiles (corridors, live, stale, average markup).
- Table: corridor, mid-market rate, markup, customer rate, source, updated, status, Edit and History.
- Edit dialog: source, mid-market (read only when Auto), markup percent, resulting customer rate, reason, last change.
- History panel: append-only list of rate syncs and manual changes with who and when.

## States

- Live, Stale (older than 1 hour, warning), Manual (neutral).
- Validation: markup outside 0% to 5% blocks Save and says so.
- A change over 1 percentage point shows that a second finance approver is needed.
- Support role: View only banner, no Edit or History.

## Rules

- Markup is a percent of mid-market; the customer rate is shown live in the dialog.
- Changes apply to new quotes only; shown quotes keep their rate for 15 minutes.
- A reason is required and is written to the audit log.
- Only finance and super_admin may edit; other roles do not see the controls.

## Upgrade

Built: a currency list panel under Settings (office-rates-panel). New: corridor-based table with markup, source, stale detection, validation limits, reason and history. Its own route (Rates) instead of a settings tab.

## Code

office/app/rates, office/components/settings/office-rates-panel.tsx

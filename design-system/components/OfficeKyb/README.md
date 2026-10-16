# OfficeKyb

## Purpose

Define what a merchant must provide to be approved, by country, type and tier, so review stays consistent.

## Anatomy

- Page header with New profile (compliance and super admin only).
- Cards grouped by country, fallback group (*) first; each row: label, field and document counts, sanctions check, type, tier, Live or Paused badge.
- Edit dialog: country, type, tier (locked after creation), label, Sanctions check and Active checkboxes, Fields row editor (key, label, type, required, remove), Documents row editor (kind, label, required, expires, remove).
- Footer: Cancel and Save profile; support sees Close only.

## States

- Default list, row click opens the dialog.
- Validation: message states what to fix (every field needs a key and a label, keys unique, at least one field or document).
- Read-only: role without edit rights sees disabled inputs, no add or remove, a notice at the top.
- Empty: No KYB profiles yet.

## Rules

- Controls the role cannot use are hidden, not disabled without reason.
- Saving replaces the profile for that country, type and tier; the change is audited.
- Keys are lowercase with underscores; labels are what the merchant sees.

## Upgrade

Differs from built Office: Built layout is kept. Upgrade adds a role notice banner explaining read-only access, a paused state with a word as well as a badge, and a saved audit line in the dialog footer.

## Code

office/app/kyb/page.tsx, office/components/merchants/requirements-editor.tsx

# OfficeCompliance

## Purpose

Work screening alerts and review cases: understand the hit, decide, and leave a note that stays in the audit log.

## Anatomy

- Case list: ID, customer, trigger, severity, age, SLA, owner, status; tabs Open, Escalated, Resolved.
- Case detail: screening hit side by side with the customer, related transfers, append-only audit trail, Resolve panel (False positive, Escalate, Confirmed match).
- Resolve dialog with outcome consequence, required note and audit line.

## States

- List default, selected, hovered, escalated row, empty (no open cases).
- Detail, resolve dialog.

## Rules

- Only compliance and super admin see the Resolve panel; ops and support read only.
- A note is always required; entries cannot be edited, only followed by a new one.
- Related transfers are held until the case is resolved and the dialog says so.
- Severity is a word with an icon: High destructive, Medium warning, Low neutral.

## Upgrade

Differs from built Office: the built Compliance page is a customer verification list (name, email, overall status) with identity and address review. Upgrade is a case workflow: screening alerts, SLA, hit comparison, transfer holds, resolve with note and audit trail. Document review moves to KYC review.

## Code

office/app/compliance/page.tsx

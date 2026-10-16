# OfficeSettings

## Purpose

Platform-wide options and who may do what in Office.

## Anatomy

- Route tabs: General, Hub services, Payment methods, Rates, Fees, Roles. Each is its own route.
- General: payout hold days, base currency, default language, support email, phone and hours, languages enabled, registration and email verification, Save and Discard.
- Maintenance mode card: switch, customer message, planned end.
- Roles: people table with role, status and last active, Invite person, and a matrix of what each role can do.

## States

- Maintenance Off or On; confirmation dialog states who is affected and in-progress orders.
- Invited people show Invited until first sign-in.
- Role change warns about lost controls and signing out.
- Only super_admin sees Roles and the Maintenance switch.

## Rules

- Roles: ops, support, finance, compliance, super_admin. A control a role may not use is hidden.
- At least one super_admin must remain; the dialog says so when it would break.
- A language without complete copy shows English.
- Every change is in the audit log with who and when.

## Upgrade

Built: one settings page holding platform configuration, payment methods and admin users together. New: split by route, maintenance with end time and message, language list, role matrix, role change confirmation.

## Code

office/app/settings, office/components/settings

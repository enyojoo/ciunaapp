# TeamMemberRow

## Purpose
Shows who can work in a business and what each role can do, and lets the owner change roles or manage invites.

## Anatomy
Avatar with initials, name and email, a permissions summary line, role badge, and actions (Change role, Resend, Revoke). The role picker lists Manager, Staff and Finance with a one-line description each.

## States
Owner (you), manager, staff, finance, invite pending (envelope avatar, expiry, Resend and Revoke).

## Rules
The owner role has no actions. Roles: Owner everything; Manager orders, catalog, messages, reviews, no money; Staff orders and messages; Finance earnings, statements, payouts. Pending is warning with an icon and a word.

## Upgrade
New: the permissions summary line and invite expiry. Roles exist in `seller` session types today.

## Code
`seller/app/(shell)/settings` (team, to extract)

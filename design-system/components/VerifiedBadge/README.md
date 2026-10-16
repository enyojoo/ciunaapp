# VerifiedBadge

## Purpose
Tells customers a seller or expert has had their identity (and, for businesses, registration) checked.

## Anatomy
Success badge with icon and tier name, or icon-only compact mark after a name; tooltip with checklist and date.

## States
individual, registered business, compact, unverified (no badge), tooltip open.

## Rules
Success colour pair with icon, never colour alone. Two tiers only. Unverified shows nothing. Tooltip lists real checks and the check date and does not name providers. Compact icon carries aria-label.

## Upgrade
Built as `mobile/components/verified-badge.tsx`: success-coloured check icon with a screen-reader label and two tiers (individual, registered business) from the verification tier. Used for stores and experts everywhere. Not built: the tooltip with check date (needs the date and checklist from the backend).

## Code
`web/components/hub/verified-badge.tsx`, `mobile/components/verified-badge.tsx`

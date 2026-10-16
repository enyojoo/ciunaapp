# OfficeReviewsModeration

## Purpose

Moderate customer reviews: hide what breaks the rules, restore what was hidden by mistake.

## Anatomy

- Tabs Published, Hidden, All; rating filter; search by merchant.
- Table: Merchant and type, stars, excerpt, customer, date, status, reply flag, Action.
- Hide dialog with reason chips and a free text reason; Unhide in one click.

## States

- Hide dialog open.
- Hidden tab shows the reason under the excerpt.
- Support role: no Action column.
- Empty: No reviews match.

## Rules

- Reasons: Contains personal data. Not about this purchase. Abusive language.
- Hidden reviews leave the rating immediately; the reason is audited.

## Upgrade

Built

## Code

office/app/reviews/page.tsx

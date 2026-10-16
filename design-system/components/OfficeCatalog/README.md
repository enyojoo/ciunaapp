# OfficeCatalog

## Purpose

One place to review, approve and edit products from Food and Mart sellers.

## Anatomy

- Tabs by status (Needs review, Live, Rejected, Paused, All), search, line and category filters, saved views.
- Table: photo, name and seller, line, price, status, waiting time, owner, next action (Review or Claim).
- Review layout: photos and listing details with checks on the left; templated rejection reasons, message and decision on the right.
- Edit dialog: name, price, category, status, description, languages.

## States

- In review, Live, Rejected, Paused.
- Over 24h waiting is highlighted like the merchants queue.
- Validation: missing translation or over-long name blocks Save.
- Empty queue: confirmation, not a blank table.

## Rules

- A rejection needs a reason; the chosen template and message are shown to the seller verbatim.
- Approve publishes immediately; a seller is told by in-app notice and email.
- Edits by Office are logged and the seller is told what changed.
- Claiming a product assigns it to you; others see the owner.

## Upgrade

Built: separate Food and Mart products pages, a new-product form and an edit page, no review queue. New: one catalog with a review queue, rejection templates, claim and owner, and an edit dialog.

## Code

office/app/food/products, office/app/mart/products, office/app/products/[id]/edit, office/components/hub

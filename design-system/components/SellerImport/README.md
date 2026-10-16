# SellerImport

## Purpose
Add many products at once from a CSV file. Rows are checked in the browser first; only valid rows are created, as drafts.

## Anatomy
- Back to catalog, title "Import products", intro (up to 200 products, created as drafts).
- Step 1, Get the template: Download template, Choose CSV file.
- Step 2, Check your products: summary ("3 ready, 3 with problems. Only ready rows are imported."), preview table (row, name, category, price, sale price, currency, quantity, fulfilment, status) with the reason beside each failing row; on phones each row is a card.
- Import n products button; progress bar with "2 of 3 imported" and a percentage.
- Summary banner ("2 created, 1 failed."), failed rows with the reason, Import another file and View catalog.

## States
Initial; file unreadable (error banner); preview with errors; importing (button busy, file chooser disabled); finished with all created; finished with failures; too many rows (only the first 200 are used, warning banner).

## Rules
- Rows are validated with the same rules as the editor, so the message matches.
- Created products are drafts: photos are added afterwards, then published.
- The import never overwrites existing products.

## Upgrade
Built in `seller/components/catalog/bulk-import.tsx` and `seller/app/(shell)/catalog/import/page.tsx`. New here: the card layout for the preview on phones (built scrolls a 720px table sideways) and a one-line file hint (.csv, up to 2 MB). Messages and flow are the built ones.

## Code
`seller/components/catalog/bulk-import.tsx`, `seller/components/catalog/csv.ts`

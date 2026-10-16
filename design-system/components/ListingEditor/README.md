# ListingEditor

## Purpose
Create or edit a product (and, with a different middle block, a service). The place a seller spends most of their catalog time, so it must never lose work.

## Anatomy
Page header (breadcrumb, title, status badge, Preview) with banners for review and errors; two columns on desktop: left Basics (language tabs, title, short, category, long), Photos (main plus gallery up to 8, 4:3), Price and stock (price, sale price, currency, unlimited, count, sold out); right Fulfilment (delivery, pickup, digital), Visibility and Archive, Listing health. Sticky save bar at the bottom: unsaved message, Save as draft, Publish or Save changes. Phones stack the sections single column with the save bar above the bottom nav.

## States
Draft with autosave note; unsaved; validation errors per field with a summary banner; in review (amber banner and badge, customers keep the last approved version); rejected (destructive banner with the Office note); live; fulfilment incomplete (warning banner with link); publishing (busy button); sold out.

## Rules
Default language is required, others optional and marked with a dot when filled. Errors name the fix ("Enter a price above zero"). Required is text, not an asterisk. Publish stays disabled while errors exist. Archive asks to confirm. Never lose work: unsaved state is stated in words.

## Upgrade
Built today: sections, language tabs, errors, review banners, save bar. New: desktop two-column layout, listing health card, explicit Visibility card.

## Code
`seller/components/catalog/product-form.tsx`

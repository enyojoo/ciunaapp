# SellerProductEditor

## Purpose
Create and edit a product in sections, in every language the seller serves, without losing work.

## Anatomy
- Back to catalog, title (Add product or Edit product), moderation hint ("Changes to text and photos go live straight away. Ciuna reviews them afterwards and may ask you to fix them").
- Review banner (Under review, or Rejected with the reason).
- Basics: language tabs (English default, Русский, 中文; a dot marks a filled language), name, short description, category, full description.
- Photos: main photo and up to 8 more, cropped square, add or replace.
- Price: price, sale price (must be lower), currency.
- Stock: Unlimited stock switch, quantity, Sold out switch.
- Fulfilment: segmented control Delivery, Pickup, Digital, with a warning and Set up link when delivery zones or pickup details are missing.
- Visibility: status and a Visible in your store switch.
- Archive product (opens a confirm dialog).
- Sticky save bar: Save as draft or Move to draft, and Publish or Save changes. Publish is disabled with a hint until the business is approved. Unsaved changes are named in the bar.

## States
New; editing live; unsaved changes; each language tab; validation errors (named under each field, plus "Check the highlighted fields."); under review; rejected; Publish disabled; archive confirm; saving (spinner in the button).

## Rules
- Only the default language is required. Other tabs fall back to the default text.
- Errors say what to fix: "Enter a price above 0.", "The sale price must be lower than the price."
- Labels above fields; Required is text.
- Leaving with unsaved changes asks first.

## Upgrade
Built in `seller/components/catalog/product-form.tsx`. Differences:
- Desktop is two columns here (content left, stock, fulfilment and visibility right); the built form is one column.
- The Visibility card is new; today status changes through the Save buttons and Pause in the list.
- Everything else (sections, tabs, save bar, archive confirm) matches.

## Code
`seller/components/catalog/product-form.tsx`, `seller/app/(shell)/catalog/new/page.tsx`, `seller/app/(shell)/catalog/[id]/page.tsx`

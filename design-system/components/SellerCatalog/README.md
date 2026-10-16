# SellerCatalog

## Purpose
The seller's product list: find a product, see its state at a glance, and change the two things that change daily (sold out, paused) without opening it.

## Anatomy
- Page header with Add product (primary) and Import from CSV (secondary on wider screens). A link row: Delivery zones and pickup, and Import from CSV on phones.
- Neutral banner when the business is not yet approved ("You can publish once Ciuna approves your business").
- Search field and status tabs: All, Live, Draft, Archived.
- Product row or card: thumbnail, name, price (sale price in ink with the list price struck through), status badge, stock chip (n in stock, Unlimited, Sold out), review line (Under review, or Rejected with the reason), Sold out switch, Pause or Publish.

## States
List; filtered; store in review (Publish disabled); empty ("No products yet" with Add product and import); no search match; first load (skeleton rows only when nothing is cached); error with retry; row busy (controls disabled while a change saves, rolled back with a toast if refused). Archived rows show no controls.

## Rules
- Sold out is one tap and saves straight away. Pause and Publish are the only status buttons in the list; archive lives in the editor.
- Review state uses words and an icon, in warning or destructive text, never colour alone.
- Rejected shows the reviewer's reason, clipped to two lines.
- Money through Amount: `₽390`, struck `₽450`.

## Upgrade
**Built**
- List, search, status tabs, sale price, stock chip, review line, inline Sold out and Pause or Publish, empty, no-match, skeleton, error and busy states (`seller/app/(shell)/catalog/page.tsx`).
- Phone: Add product hugs its width; Delivery zones and Import links sit under it; the "can publish once approved" banner is below the links, above the search.
- Desktop and tablet: sidebar with a top bar (bell and account only, no search). Empty state has one action, Add product.

**Differs**
- The product still switches to the row layout at `xl` (1280px). Between 768 and 1279px the row stacks into a card; the 768 frame shows that as built.
- The card now draws the 1024px row layout the reconciliation asks for, with narrower columns (128px status, 256px actions) so the name keeps room.

**Not built yet**
- Row layout from `lg` (1024px) instead of `xl`; the 1024 frame is captioned "Not built yet".

## Code
`seller/app/(shell)/catalog/page.tsx`

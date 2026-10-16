# Ciuna Seller

The merchant portal for stores and experts. Web only, responsive, installable. A seller runs their day from a phone, so every core task works at 375px.

## Principles
1. **What needs me now?** Home leads with actions: new orders, bookings to accept, low stock, documents expiring. Numbers second.
2. **One task per screen on phones.** Lists open full-screen detail; forms use sections with a sticky save bar.
3. **Never lose work.** Autosave drafts, confirm destructive actions, show unsaved state.
4. **Time is money.** Accept/reject shows the SLA countdown. Out-of-stock is one tap.
5. **Plain money.** Every earning row shows gross, Ciuna fee, net. Fees are never a surprise.
6. **Multilingual by default.** Language tabs on listing forms; a seller can ignore languages they don't serve; the default language is required.

## Shell
- ≥768px: 248px sidebar (logo, nav, store switcher at the bottom), 64px top bar (search, notifications, account), content.
- <768px: top bar (store name, notifications), bottom nav of 5 destinations, More sheet for the rest. Content has 16px gutters and 96px bottom padding to clear the nav.
- Store switcher for people on several merchants.

## Core screens
Onboarding checklist; Home; Orders board and order detail; Catalog list, product editor, import; Services, service editor; Availability; Bookings; Messages; Earnings, statement, payout request; Store/Profile; Reviews; Team; Settings (notifications, language, documents, payout methods).

## Orders board
Columns on desktop (New, Accepted, Preparing, Ready/Shipped); on phones, a segmented list by status with counts. An order card shows number, time, items summary, total, fulfilment type, SLA timer and the single next action. Reject asks for a reason.

## Forms
Labels above fields. Errors under the field in `destructive-text` with an icon. Required marker is text ("Required"), not just an asterisk. Sticky action bar with Save and Discard. Images: drag and drop on desktop, camera/gallery on phones, crop to 4:3.

## Status
Listing and merchant status: Draft, In review, Live, Paused, Rejected. Order status: New, Accepted, Preparing, Ready, Shipped, Completed, Rejected, Cancelled, Refunded. Colour pairs follow the global vocabulary.

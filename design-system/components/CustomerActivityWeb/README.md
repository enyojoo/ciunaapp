# CustomerActivityWeb

## Purpose
The Activities page on desktop web: everything money touched (transfers, marketplace orders, expert bookings, referral payouts) in one table, using the width the phone does not have.

## Anatomy
Title "Activities" and search on one line. Filter chips (All, Transfers, Orders, Bookings, Payouts; "Orders" here means food, mart and other marketplace orders). Two columns: the list on the left, a 280px aside on the right (Total spent, Completed, Need help with an order). The list is a table with a header (Order, Date, Status, Amount), rows of 68px grouped by day. Row: 40px line icon, name and line, date, status chip, amount (true minus, plus for payouts), chevron. Content is at most 1140px wide and centred.

## States
Default; first use (dash and zero in the aside); no search match; could not load with retry. Loading shows skeleton rows in the same table. Offline shows the saved list with a one-line banner above the table.

## Rules
Same statuses, amounts and wording as CustomerTransactions (the phone). The whole row is the tap target and opens the order. The aside stays in place while the list scrolls. Orange only on the active chip and the single empty or error action. Below 900px wide the page falls back to the phone layout.

## Upgrade
Differs from the built page (`mobile/app/(app)/activities.tsx`), which stretches the phone layout: summary tiles, search and chips stacked above one narrow column. Table header, columns, the aside and the 1140px width are New.

## Code
`mobile/app/(app)/activities.tsx`, `mobile/components/activity-desktop.tsx`

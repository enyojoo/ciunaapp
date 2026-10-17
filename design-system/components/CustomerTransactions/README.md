# CustomerTransactions

## Purpose
The Activities tab: one list for everything money touched: send transfers, marketplace orders and expert bookings.

## Anatomy
Title "Activities" (the tab and the page use the same word), two summary plates (total volume, completed count), search, filter chips (All, Transfers, Orders, Bookings, Payouts), day-grouped rows. Row: 40px line icon, counterparty, line and time, amount (true minus, plus for payouts), status chip.

## States
Default; filtered; empty first use; no search match; first-load skeleton; error with retry; offline cached with one-line banner; Russian with a pressed row. Tapping a row opens OrderTracking for orders, the booking detail for bookings, the receipt for transfers.

## Rules
Statuses follow StatusBadge: Completed and Confirmed green; Preparing, Pending, Awaiting amber; Cancelled and Refunded neutral; Failed red. Amounts: symbol first, no `.00`, tabular figures. Orange only on the active chip and the single empty/error action. Whole row is the tap target (68px).

## Upgrade
Built in `mobile/app/(app)/activities.tsx`: summary tiles, search, chips (All, Send, Hub, Bookings, Payout), grouped rows, skeleton rows, retry state, saved-data note when a refresh fails.

## Code
`mobile/app/(app)/activities.tsx`

# CustomerTransactions

## Purpose
One activity list for everything money touched: send transfers, marketplace orders and expert bookings.

## Anatomy
Title, two summary plates (total volume, completed count), search, filter chips (All, Transfers, Orders, Bookings, Payouts), day-grouped rows. Row: 40px line icon, counterparty, line and time, amount (true minus, plus for payouts), status chip.

## States
Default; filtered; empty first use; no search match; first-load skeleton; error with retry; offline cached with one-line banner; Russian with a pressed row. Tapping a row opens OrderTracking for orders, the booking detail for bookings, the receipt for transfers.

## Rules
Statuses follow StatusBadge: Completed and Confirmed green; Preparing, Pending, Awaiting amber; Cancelled and Refunded neutral; Failed red. Amounts: symbol first, no `.00`, tabular figures. Orange only on the active chip and the single empty/error action. Whole row is the tap target (68px).

## Upgrade
Differs from the built app (`transactions.tsx`): title is Activity; adds the Bookings chip and expert rows; marketplace rows show one status chip instead of a "payment · fulfilment" text line; outgoing amounts carry a minus; skeleton rows replace the spinner; error and offline states are new.

## Code
`mobile/app/(app)/transactions.tsx`

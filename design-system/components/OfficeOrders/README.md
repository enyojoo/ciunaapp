# OfficeOrders

## Purpose

Find any marketplace order, see what went wrong, and cancel or refund it if your role allows.

## Anatomy

- Tabs (All, Exceptions, Active, Completed, Cancelled and refunded), search, line and date filters, saved views.
- Table: order, customer, seller, line, total, status, placed, exception flag.
- Detail: summary, exception banner with the automatic next step, timeline, actions, audit trail.
- Refund dialog: amount, reason, note.

## States

- Preparing, Awaiting seller, Completed, Cancelled, Refunded, Failed.
- Exception flags: seller silent, payment mismatch.
- Role views: support cancels and messages; finance refunds.

## Rules

- A control the role may not use is hidden and the reason is stated beside the actions.
- Refund and cancel name the money and what happens next; a reason is required.
- Every action writes to the audit trail with who and when.
- Customers and sellers never see the provider; Office may.

## Upgrade

Built: an inbound queue of orders and expert bookings with service-line badges. New: full order list with exceptions, timeline, role-based cancel and refund, refund dialog.

## Code

office/app/orders

# OfficeTransactions

## Purpose

Follow every Send transfer through its payment and payout steps and act on the ones that failed, by role.

## Anatomy

- Tabs by type (Send money, Marketplace, Food and Mart, Referral payouts).
- Filters: search, status, corridor, date range, saved views. Table: reference, customer, corridor, amount sent and received, provider, status, age.
- Detail panel: status banner, timeline with provider steps, amounts and fees, recipient and settlement reference, actions.
- Refund dialog: consequence, fee kept, required reason and note.

## States

- Completed, Processing, Awaiting payment, On hold, Failed, Refunded.
- Panel for ops (Retry payout), finance (Refund) and support (read only, note only).
- Refund dialog, no results.

## Rules

- Provider names (YooKassa, Bitbanker) appear in Office only, never in customer or Seller screens.
- Actions not allowed for the role are hidden; support sees a banner saying why.
- Refund and retry write who, when and why to the audit log.
- Money keeps cents in the fee breakdown and drops them in lists.

## Upgrade

Differs from built Office: the built page opens a dialog per row, offers bulk status updates and a Bitbanker settlement form. Upgrade replaces bulk status edits with role-based Retry and Refund, adds the timeline, age and corridor, and moves settlement details into the panel.

## Code

office/app/transactions/page.tsx

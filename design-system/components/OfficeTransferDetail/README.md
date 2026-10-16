# OfficeTransferDetail

## Purpose

Give staff one full page per Send transfer to see what happened at every provider step, decide what to do next, and leave a trail. It replaces the per-row dialog on Transactions.

## Anatomy

- Header: breadcrumb, reference, status badge, creation and age line, owner with Claim, Open customer and Receipt.
- Left column: Sender and Recipient panels; Amounts and rate snapshot (customer paid, fee, mid-market, markup, locked customer rate, recipient gets, provider fee, estimated margin); Provider timeline (Payment in, Conversion, Payout out) with provider, raw provider id, method, amount, attempts list and times.
- Right column: Actions (by role), Notes (staff only), Audit trail (append-only).
- Dialogs: Retry payout, Refund customer, Mark delivered manually, Add note. Each needs a reason (chips) and writes who, when and why to the audit log.

## States

- Completed: all steps done, only Add note.
- Payout failed: red banner, attempts listed, Retry payout, Refund, Mark delivered manually, Add note.
- Stuck payment: warning banner, provider status pending, later steps "Not started"; ops can Check with provider and Add note.
- Refunded: refund step with refund id, notes only.
- Support read-only: View only banner, provider names, ids, phone and margin hidden, only Add note.

## Rules

- Roles: finance and super_admin retry, refund and mark delivered; ops claim, check with provider and add notes; support add notes only. A control the role may not use is hidden and a line says why.
- Provider names (YooKassa, Bitbanker) and raw ids are Office only and hidden from support.
- Retry reuses the locked quote and an idempotency key so the recipient cannot be paid twice.
- Mark delivered manually moves no money; it needs a reference of at least 3 characters.
- Refunds return the full amount paid to the original payment method.
- Notes are staff only; the audit trail cannot be edited.

## Upgrade

Differs from built Office: today a row opens a dialog on the Transactions page with bulk status edits and a Bitbanker settlement form (PATCH admin/transactions/[id]/status). New: a routed detail page, role-gated Retry, Refund and Mark delivered with reasons, attempts list, notes and audit trail. Needs: attempts and notes storage, a refund endpoint, a retry endpoint with idempotency key, and an estimated margin calculation.

## Code

office/app/transactions (new route transactions/[id])

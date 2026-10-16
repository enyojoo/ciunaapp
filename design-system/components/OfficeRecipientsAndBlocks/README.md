# OfficeRecipientsAndBlocks

## Purpose

Let compliance find a recipient from an account number, see everything sent to them, and block or unblock recipients and senders with a reason and evidence that the next reviewer can read.

## Anatomy

- Tabs: Recipient lookup, Blocked (with count).
- Search by full or last-four account number, recipient name or Ciuna ID. Results always show masked accounts: recipient, added by, transfer count, total sent, status.
- Detail panel: masked account, holder, country, first seen, senders, transfers; Show full account number (logged); Block recipient; Related transfers with link to Transactions.
- Blocked table: type (Recipient or Sender), name and account, reason, evidence note, who and when, related transfers, Unblock.
- Dialogs: Block recipient (scope, reason chips, evidence note, effect on transfers in progress), Block sender, validation, Unblock.

## States

- Results with several matches on the same last four digits.
- Blocked list empty ("No blocks yet"); search with no match ("No recipient matches ····9999").
- Evidence missing: Block is disabled and the error says what to add.
- Support: sees masked results and related transfers, no reveal, no Block; Report to compliance instead.

## Rules

- Full account numbers are never in a list. Revealing is allowed for compliance and super_admin only and is written to the audit log.
- Blocking and unblocking need a reason and an evidence note (staff only) and write who, when and why to the audit log.
- A recipient block holds transfers in progress for review and refuses new ones; the customer sees "We can’t send to this recipient. Contact support." with no reason.
- A sender block stops all new Send transfers for that person; marketplace orders are not affected.
- Unblocking does not release held transfers automatically.
- Names on the card are sample data.

## Upgrade

New. Not built: today a recipient is only visible inside a customer's transfer. Needs: a blocklist table (type, account hash, reason, evidence, actor, timestamps), a search index on masked and hashed account numbers, the block check in the transfer-create endpoint, and the reveal audit event.

## Code

office/app/recipients (new), api/app/api/admin (new blocks route)

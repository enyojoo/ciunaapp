# OfficeKyc

## Purpose

Review customer identity and address documents and decide, with reasons the customer reads verbatim.

## Anatomy

- Queue: In review, Approved, Rejected, All; age, SLA, owner, Claim or Review.
- Review page: documents on the left with a comparison of document against profile; decision on the right (Approve, Reject), templated reasons, the exact customer message, internal note, history.
- Reject and approve confirmation dialogs.

## States

- Queue default, selected and hovered rows, resubmitted item, empty queue.
- Review with a mismatch flagged, reject dialog, approve dialog.

## Rules

- Rejection reasons come from templates; the message the customer sees is shown before sending.
- A mismatch is flagged in words (Differs), not only colour.
- Opening a document is logged with the reviewer's name.
- Approval states the new limits; rejection states that the level stays.

## Upgrade

Differs from built Office: the built page lists submissions as cards with a review dialog and free-text rejection reason. Upgrade adds the queue with age, SLA and claim, the document and profile comparison, templated reasons and confirmation dialogs.

## Code

office/app/kyc/page.tsx

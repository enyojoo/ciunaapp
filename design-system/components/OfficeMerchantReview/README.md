# OfficeMerchantReview

## Purpose

Review one merchant application: check the answers and documents on the left, decide on the right, with a reason the merchant sees verbatim.

## Anatomy

- Left column: Profile, Application answers against KYB requirements for the merchant's country, Documents (Open, Approve, Reject with reason), Team, Audit trail.
- Right column, sticky: Approve, Request changes, Reject, Suspend or Reinstate, reason templates as chips, reason field, owner team.
- Decision dialog: title as a question, reason chips, textarea, Cancel and a named confirm button.

## States

- Documents pending: Approve is disabled and a hint says why.
- All documents approved and no required answers missing: Approve is enabled.
- Missing required answer: shown in destructive text with an icon and the words Required, not provided.
- Live merchant shows Suspend; suspended shows Reinstate with the previous reason.
- Support: panel hidden, trail only.

## Rules

- The reason is shown to the merchant verbatim; chips only fill the textarea.
- Reject and Suspend use the destructive button; Approve uses the primary one.
- Disabled Approve always has a visible reason, never a bare grey button.
- Every action is written to the audit trail with actor and time.

## Upgrade

Differs from built Office: the built review page has the sections and a decision dialog but no sticky panel, no inline Approve-disabled reason, and no owner team. Upgrade moves decisions into a sticky right panel and adds validation of answers against the KYB requirements.

## Code

office/app/merchants/[id]/page.tsx, office/components/merchants/decision-dialog.tsx

# OfficeReferrals

## Purpose

Configure the referral programme and review who is referring whom, including abuse.

## Anatomy

- Programme card: on or off, reward for referrer and friend, qualifying transfer, yearly limit, release timing, link expiry; Save and Discard.
- Referrals table: referrer, code, referred count, rewards paid, status, View. Search and status filter.
- Side panel: referrer summary, referred friends with reward state, Block referrer.
- Block dialog with reason and audit note.

## States

- Active, At limit (warning), Blocked with reason (destructive).
- Programme off: warning banner with Turn on, empty table.
- Unsaved settings: Save enabled, Discard offered.

## Rules

- Rewards are wallet credit and release only after the qualifying transfer completes.
- Changing amounts applies to future referrals only.
- Blocking asks first, says rewards already paid stay, and needs a reason.
- Only ops, finance and super_admin edit settings; support sees the table only.

## Upgrade

Built: referrals page with search, referrer rows and a detail dialog. New: programme settings on the same route, limits, At limit and Blocked states, side panel instead of a dialog, block action with reason.

## Code

office/app/referrals

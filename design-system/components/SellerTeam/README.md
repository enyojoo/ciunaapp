# SellerTeam

## Purpose
Control who can sign in to a business and what they can do.

## Anatomy
Invite form (email, role, Send invite) with role help and permissions table; members with role select and remove; owner locked; pending invites with expiry and Copy link; remove confirm.

## States
Default; invite error (too many open invites); phone members; remove confirm.

## Rules
The owner and your own row cannot change role or be removed. Removal confirms and names the person. Invite links are copied, never shown in a toast unless copying fails.

## Upgrade
Built in seller/app/(shell)/settings/team/page.tsx. Differs: the permissions table, pending-invite expiry and Copy link, and the named remove confirm are proposals; the matrix is illustrative, real permissions come from the server.

## Code
seller/app/(shell)/settings/team/page.tsx

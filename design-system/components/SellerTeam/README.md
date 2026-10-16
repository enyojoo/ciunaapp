# SellerTeam

## Purpose
Control who can sign in to a business and what they can do.

## Anatomy
Invite card (title, role help line, email, role select, Send invite, error banner under the form); members card (name, with "· You" on your row, email, role select and remove; the owner and your own row show the role as text); pending invites (email and role); remove confirm ("Remove this person?", Cancel, Remove). Phone stacks the invite fields and puts the role select and remove on a second line.

## States
Default; invite error (for example too many open invites); invite sent (link copied, toast "Link copied"; if copying fails the link is shown in the toast); phone members; remove confirm. Owner only: other roles get the No access page.

## Rules
The owner and your own row cannot change role or be removed. Roles offered on invite are Manager, Staff and Finance. Removal always confirms. Invite links are copied, never shown in a toast unless copying fails.

## Upgrade
**Built**
- Page, invite form with role help, members with role select and remove, owner and own row locked, pending invites (email and role), destructive confirm, invite link copied with a toast, owner-only access.
- Desktop top bar has the bell and account only (no search, decision D2); phone top bar has the business switcher and menu.

**Differs**
- The card used avatars, a lock icon on Owner and "Owner · cannot be changed"; the product shows plain text, so the as-built frames do too.
- The card's confirm named the person; the product asks "Remove this person?" with no body.

**Not built yet** (drawn in the frames marked "Not built yet")
- Role permissions table under the invite form (illustrative; real permissions come from the server).
- Pending invites with expiry date and a Copy link action.
- Avatars on member rows and a confirm that names the person and business.

## Code
`seller/app/(shell)/settings/team/page.tsx`

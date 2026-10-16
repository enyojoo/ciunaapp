# CustomerReferrals

## Purpose
Lets a customer invite friends, see what they earn when those friends send money, and withdraw the balance.

## Anatomy
Header and a teal Refer plate (the refer colour is the programme's identity; it is never a status). Your code: dashed code field with a Copy action and the link under it. Commission tier: current rate large, three segments (0–2, 3–5, 6+ friends) with the current ones filled, a line saying how many more to the next. Balance: Available to withdraw and Lifetime earned. Actions: Share link (primary) and Withdraw (secondary). My referrals list per friend with transactions, reward window and earnings. Withdraw sheet: recipient, amount, Cancel, Submit request.

## States
Default; share sheet; friends list; withdraw; withdraw over balance; empty; programme paused (neutral banner); first load; Russian.

## Rules
Teal marks the programme, orange is only the one action. Money uses the shared format (`₽3,840`). Say how a reward is earned in one line with a worked example. Reward windows show a date. Over-balance errors give the number to stay under. Nothing implies guaranteed income; the paused state is explained, not hidden.

## Upgrade
Differs from the built app (`referrals.tsx`): the code is shown as a copyable code plus link (today only the link); the tier is shown as a progress strip instead of a table of rules; the Share sheet, an explicit empty state and the paused banner are New or restyled; the Refer pill on Home uses the same teal.

## Code
`mobile/app/referrals.tsx`

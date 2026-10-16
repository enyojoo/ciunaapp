# PayoutMethodRow

## Purpose
A saved destination for withdrawals (SBP phone or bank account) with its verification state.

## Anatomy
Icon tile, name with masked detail and optional Default badge, secondary line (holder, added date or reason), verification badge, actions (Make default, Remove).

## States
Verified, waiting for verification, default (badge), non-default (Make default shown). Stacked on phones with actions in a menu.

## Rules
Only verified methods can be selected when withdrawing. Details are masked. Verified is success, Waiting is warning; each carries an icon and a word. No provider names.

## Upgrade
Matches `seller/app/(shell)/earnings/methods`; new is the Default badge and waiting copy.

## Code
`seller/components/earnings/add-method-sheet.tsx`

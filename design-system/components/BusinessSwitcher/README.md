# BusinessSwitcher

## Purpose
Shows which business the seller is working in and, when they belong to several, switches between them.

## Anatomy
Logo tile (square for stores, round for experts, or the first letter), business name, "Type · Role" line, chevron when switchable. The open list has the same rows, a check on the current one and an Add a business row.

## States
Single business (no chevron), several (chevron, hover), expert vs store, long name (truncated), open list.

## Rules
Role labels are Owner, Manager, Staff and Finance. Switching returns to Home. 56px rows in the list. The logo tile uses the brand colour as an avatar, not as a button.

## Upgrade
Matches `seller/components/shell/merchant-switcher.tsx`; new is the explicit open list with Add a business.

## Code
`seller/components/shell/merchant-switcher.tsx`

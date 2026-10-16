# StatTile

## Purpose
A single headline number on Seller Home. Home leads with actions, numbers second, so each tile also says what to do or what changed.

## Anatomy
Icon and label (13px muted), value (30px bold, tabular; 26px on phones), one line below: delta, count of exceptions or a short hint. A tile can link to its list.

## States
default; actionable (tinted, e.g. New orders above zero, with an overdue badge); delta up (success text) and down (destructive text) with arrow and words; zero with a calm sentence; no data ("No reviews"); loading skeleton on first load only.

## Rules
Money through `Amount` (`₽12,480`, true minus). The tile never shows a delta by colour alone. Four tiles on desktop in a row, two by two on phones. Use cached data first.

## Upgrade
New in Seller (Home currently lists actions only).

## Code
`seller/app/(shell)/home` (to be built)

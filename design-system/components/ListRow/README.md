# ListRow

## Purpose
One row in a grouped list on the customer app: Account settings, delivery areas, recipients, payment methods. A `ListGroup` is the white rounded block that holds the rows and draws the dividers.

## Anatomy
Optional leading icon well (36, radius 30% of size) or avatar. Title (16) with an optional subtitle (13, muted). Optional value text (13, muted) before the chevron. Optional trailing badge or flag. Chevron (16, `subtle`) when the row is tappable. Group title is a 12 caps label above the block. Divider is a hairline inset past the leading column.

## States
default, pressed (scale 0.99, haptic none), destructive (title in `destructive-text`), no-leading, subtitle, value, badge. Group title optional.

## Rules
- Min height 56, so the 48 tap target always fits with padding.
- Icon wells are tinted by meaning only: neutral by default, `primary-tint` for the one thing to notice, success or warning for a state. Never decorative colour per row.
- The chevron appears only when the row does something. Value text and badges sit before it.
- Never nest a `ListGroup` inside a card. Maximum 7 rows before splitting into two groups.
- A destructive row is the last one in its group, and asks a direct confirmation question.

## Upgrade
Replaces Expo `Row` and `GroupCard` (30 pt icon box, local borders, 17 pt group heading). Adds the caps group title, 56 pt rows, SF Symbols on iOS and Badge trailing content.

## Code
`mobile/components/ui/list-row.tsx` (`ListRow`, `ListGroup`, `IconWell`)

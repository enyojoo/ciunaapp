# Amount

## Purpose
The only way money is rendered.

## Anatomy
Symbol, whole, cents (smaller at display sizes), optional sign.

## States
Sizes: display (cents 60%), large (80%), body. Positive, negative (true minus), muted.

## Rules
Follows README money rules; zero-minor-unit currencies never show decimals; tabular figures; large values step down, never clip.

## Upgrade
Port easnerbanking `Amount`; shared `formatMoney` already in packages/shared.

## Code
`packages/ui-web/src/amount.tsx`

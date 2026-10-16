# CurrencyFlag

## Purpose
Names a currency by a small round flag plus its code, in pickers, fields and sheets.

## Anatomy
Round inline SVG (32 × 32 viewBox, one `<symbol>` per flag, reused with `<use>`) with a 1px ring; code (`RUB`); in sheets also the full name and symbol. Flags: RU, CN, NG, GH, KE, BR, MX, CO, UZ, KZ, US, and EU (circle of 12 stars). Sizes 16, 20, 24, 32, 40. Fallback: a neutral circle with a globe or coins icon.

## States
Picker field: default, focus (primary border and halo), disabled. Chip and sheet row: unselected (empty radio), selected (`primary-tint`, `primary-text`, check). Shared currencies (XOF, XAF) show the account's country flag, else the fallback.

## Rules
- A flag always comes with its code; it never stands alone and is `aria-hidden` when the code is beside it.
- Use only the supplied flags; never recolour, crop differently or invent one.
- Selected is shown with tint, check and `primary-text`, never colour alone.
- Suggested currencies first, then alphabetical by code. Search matches code, name and country.
- Rows are 56px tall; the whole row is the tap target.

## Upgrade
New. Replaces text-only currency pickers; add flags for further currencies as corridors launch.

## Code
`packages/ui-web/src/currency-flag.tsx`, `design-system/assets/flags/`

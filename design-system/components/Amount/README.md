# Amount

## Purpose
The only way money is rendered: one format for every currency, with consistent sizes, cents, sign and figures.

## Anatomy
Symbol, whole units, cents (smaller at display sizes), optional sign. Symbol first with no space (letter-only symbols like `CFA` take a space), comma thousands, dot decimals, tabular figures (`.num`), true minus `−`.

## States
Sizes: body 15 (cents 100%), medium 16 (cents 80%), large 32 (cents 60%), display 56 (cents 60%). Tone: default ink; positive `+` in `primary-text`; negative `−` in ink (never red); zero and secondary amounts muted. Cents: `auto` (drop `.00` on whole amounts in lists) or `always` (breakdowns and balances). Zero-minor currencies (XOF, XAF, RWF, UGX, JPY, KRW) never show decimals. Large values step down one size at 7 to 9 whole digits and two at 10 or more.

## Rules
- Format only through `formatMoney` / `Amount`; never by hand or with a hardcoded symbol.
- Symbols, not codes: `₽` RUB, `$` USD, `€` EUR, `¥` CNY, `₦` NGN, `₵` GHS, `KSh` KES, `R$` BRL, `CFA ` XOF/XAF.
- No `.00` on whole amounts in lists, tables, toasts and notifications; breakdowns that add up and balances always show cents.
- Money never wraps, clips or abbreviates ("1.2M"). Cents share the colour of the whole units.
- Colour never carries meaning alone; overdue and failed amounts sit next to a status word.
- No count-up animation.

## Upgrade
Port easnerbanking `Amount`; shared `formatMoney` already exists in `packages/shared`. Remove hand-formatted prices in Seller tables.

Expo: `Amount` in `mobile/components/ui/amount.tsx` with sizes display, headline, body, small; drops `.00` on whole amounts unless `precise`; true minus; tabular figures. Replaces direct `formatMoney` text in cart, checkout, order detail and Activities, which show `.00` today.

## Code
`packages/ui-web/src/amount.tsx`, `packages/shared/src/format-money.ts`

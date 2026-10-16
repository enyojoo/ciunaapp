# Typography

## Purpose
The type scales for web (Geist) and native (system font), and the rules for numerals, weights, line length and long translations.

## Anatomy
Web: display 32/38 bold, title 24/30 bold, h2 18/24 semibold, h3 15/22 semibold, body 15/22, meta 13/19 muted, eyebrow 11/15 caps +0.1em, money 40/46 bold tabular. Native: title 24, body 16, label 15, meta 13. Weights 400, 500, 600, 700. Mono (`ui-monospace`) for ids and code only.

## States
Colour states: default `ink`, secondary `muted`, link and active `primary-text`, error `destructive-text`. Truncated text ends in an ellipsis; wrapped text keeps its line height. CJK text gets 4px more line height.

## Rules
- Geist on web (customer web, Seller, Office); SF Pro or Roboto on native, by design.
- Tabular figures (`.num`) for every money amount, quantity, time and number column.
- Reading text caps near 65 characters; buttons and tables are exempt.
- Layouts survive 40% longer text (Russian, French). Buttons wrap rather than clip.
- Sentence case. Eyebrows are the only caps. No weight below 400.
- Text meets AA; text works at 200% size.

## Upgrade
Web scale is built in `tokens.json` `type` and the Tailwind config. Native scale lives in the Expo theme. Seller and Office still use some ad-hoc sizes to migrate.

## Code
`design-system/tokens.json` (`type`, `font`), `packages/shared/src/design/`

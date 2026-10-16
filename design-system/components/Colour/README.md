# Colour

## Purpose
The Ciuna palette: every token in `tokens.json` with its hex, usage and the contrast ratio of its main pairing, plus the rules for choosing between the three oranges.

## Anatomy
Groups: Brand and primary (`brand-primary`, `primary`, `primary-foreground`, `primary-hover`, `primary-text`, `primary-tint`, `primary-border`); Canvas and text (`paper`, `surface`, `ink`, `muted`, `subtle`, `hairline`); Status (`success`, `warning`, `destructive`, `neutral`, `refer`, each with solid, `-surface` and `-text`); Controls (`input-edge`, `scrim`). The contrast gate table is computed from the CSS variables in the page.

## States
Interactive colour states: default `primary`, hover and pressed `primary-hover`, focus ring `primary` at 2px with 2px offset, selected `primary-tint` fill with `primary-border` outline, disabled at 50% opacity (no new colour).

## Rules
- Neutrals carry the surface; orange marks the one thing to do. Never fill a page or large card with orange.
- Controls: `primary` fill with a white `primary-foreground` label (4.56:1). Never a white label on `brand-primary` (2.8:1).
- Orange text or links: `primary-text` (5.2:1). Never `brand-primary` for small text.
- `brand-primary` is for the logo, illustrations, avatars and large decorative shapes only.
- Text on paper or white is `ink`, secondary is `muted`. `subtle` is for icons and placeholders, never body text.
- A status is a word plus an icon on a surface/text pair, never colour alone. Orange is never a status.
- Text pairs meet 4.5:1, non-text edges and focus rings 3:1. Light only.
- Never hardcode hex in a component. Use the token.

## Upgrade
Built. Tokens flow from `tokens.json` through `npm run design:sync`; `npm run design:check` fails on any pair below its minimum. Legacy `#6B7280` secondary text is replaced by `muted`.

## Code
`design-system/tokens.json`, `packages/shared/src/design/tokens.generated.ts`

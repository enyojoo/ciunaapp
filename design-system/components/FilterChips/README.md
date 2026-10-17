# FilterChips

## Purpose
Single-select and multi-select chips, chips with counts, and a horizontally scrolling row on a phone

## Anatomy
See `preview.html` for the parts of FilterChips and every variant, labelled.

## States
Default, focus, disabled and error states where they apply are shown side by side in `preview.html`.

## Rules
Use tokens from `tokens.json` through `bundle.css`; no hardcoded colours or sizes. Targets are at least 44px. Never convey meaning by colour alone.

## Upgrade
Built as `mobile/components/filter-chips.tsx`: one horizontal row of single-choice chips, selected chip filled. Used for categories (Food, Mart home), search groups, expert categories and languages.

Expo: `Chip` and `ChipRow` in `mobile/components/ui/chip.tsx` (36 min height, selection haptic, `inset` so the row lines up with the page gutter). `FilterChips` wraps `ChipRow`.

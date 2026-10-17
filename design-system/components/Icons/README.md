# Icons

## Purpose
The single icon set (Lucide, outline) used on every surface, with sizing, stroke and colour rules.

## Anatomy
`design-system/components/icons.js` exposes `window.CZ_ICONS` (name to SVG body, generated from `lucide-react` by `scripts/build-icons.mjs`). Use `<i data-i="truck"></i>` in cards; production uses `lucide-react` and `lucide-react-native` with the same names. 24px grid, stroke 2, round caps and joins.

## States
Sizes 16 (inline, badges, chips), 20 (buttons, rows, nav), 24 (tab bar, headers), 32 (empty-state wells). Colour: default `muted`, active `primary-text`, placeholder `subtle`, white on solid fills, status `-text` colours. Filled only for a rated star and a saved heart.

## Rules
- One set. Never mix in other icon families or emoji.
- Stroke 2 always; do not scale stroke with size.
- Icons support a label, they do not replace it. Icon-only buttons carry an `aria-label` and a 48px hit area.
- Never rely on icon colour alone for a status.
- Orange logo colour is never used for meaningful icons.

## Upgrade
Built. Add icons by editing the list in `scripts/build-icons.mjs`, then run it; the check fails on a name not in the set.

Expo: `Icon` in `mobile/components/ui/icon.tsx` is the only icon entry point: SF Symbols on iOS (filled variant when active), Lucide on Android and web, one name map. Add a name there rather than importing a glyph in a screen.

## Code
`design-system/components/icons.js`, `design-system/scripts/build-icons.mjs`

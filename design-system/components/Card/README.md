# Card

## Purpose
Groups related content on a plate.

## Anatomy
Optional header (title + action), body, optional footer.

## States
default (surface, hairline border), interactive (hover shadow, focus ring), selected (primary-tint + primary-border).

## Rules
Radius 16, padding 16 phone / 24 desktop. Never nest cards more than once.

## Upgrade
Existing shadcn Card; add selected state.

Expo: `Card` in `mobile/components/ui/card.tsx` with `flat` (hairline) and `elevated` (card shadow) plus an `onPress` mode with press feedback (scale 0.985). Only three elevation levels exist on native: flat, raised, floating.

## Code
`packages/ui-web/src/card.tsx`

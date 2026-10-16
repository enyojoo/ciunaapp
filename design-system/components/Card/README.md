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

## Code
`packages/ui-web/src/card.tsx`

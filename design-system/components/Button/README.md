# Button

## Purpose
Triggers the one action a screen is about.

## Anatomy
Label (sentence case, names the action), optional leading icon, spinner when busy.

## States
default (primary fill, white label), secondary (surface, input-edge border), ghost, destructive (destructive fill, white label), link (primary-text). Hover/press: primary-hover. Focus: 3px ring. Disabled: 50% and no pointer. Busy keeps full colour.

## Rules
Min height 48 on touch, 40 on dense desktop. One default button per screen. White label on `primary`; never on the logo orange.

## Upgrade
Hover is `primary-hover`; label white on `primary`. Expo `PrimaryButton` uses `colors.onPrimary` (white).

## Code
`packages/ui-web/src/button.tsx`

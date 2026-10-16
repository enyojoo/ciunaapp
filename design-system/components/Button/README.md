# Button

## Purpose
Triggers the one action a screen is about.

## Anatomy
Label (sentence case, names the action), optional leading icon, spinner when busy.

## States
default (orange fill, ink label), secondary (surface, input-edge border), ghost, destructive (destructive fill, white label), link (primary-text). Hover/press: primary-hover. Focus: 3px ring. Disabled: 50% and no pointer. Busy keeps full colour.

## Rules
Min height 48 on touch, 40 on dense desktop. One default button per screen. Never white label on orange.

## Upgrade
Web/Office `Button` hover was `primary/90` with white label; now `primary-hover` with ink. Expo `PrimaryButton` uses `colors.onPrimary`.

## Code
`packages/ui-web/src/button.tsx`

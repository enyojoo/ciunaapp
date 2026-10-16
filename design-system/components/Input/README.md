# Input

## Purpose
Single-line text entry.

## Anatomy
Label above, field, helper or error below, optional prefix/suffix.

## States
default, focus (ring), filled, error (destructive-text + icon), disabled, read-only.

## Rules
Edge uses input-edge (3:1). Placeholder is subtle and never carries the label. Numeric fields use inputMode and tabular numerals.

## Upgrade
Merge Expo `Field`/`AppTextInput` and web `Input` behaviours.

## Code
`packages/ui-web/src/input.tsx`

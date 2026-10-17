# Skeleton

## Purpose
Loading placeholders for card, row and table, and the rule that skeletons appear on a true first load only

## Anatomy
See `preview.html` for the parts of Skeleton and every variant, labelled.

## States
Default, focus, disabled and error states where they apply are shown side by side in `preview.html`.

## Rules
Use tokens from `tokens.json` through `bundle.css`; no hardcoded colours or sizes. Targets are at least 44px. Never convey meaning by colour alone.

## Upgrade
Built in the shared UI; this card documents existing behaviour.

Expo: `Skeleton` and `SkeletonText` in `mobile/components/ui/skeleton.tsx` shimmer with a soft band (1.1s), use the `fill` token, and stop under reduced motion. The older `InlineSkeleton` stays for inline amounts until screens migrate. Shapes mirror the content that replaces them.

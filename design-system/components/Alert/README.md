# Alert

## Purpose
Inline banners: neutral, warning, destructive and success with title, body and action, plus the seller store status banners

## Anatomy
See `preview.html` for the parts of Alert and every variant, labelled.

## States
Default, focus, disabled and error states where they apply are shown side by side in `preview.html`.

## Rules
Use tokens from `tokens.json` through `bundle.css`; no hardcoded colours or sizes. Targets are at least 44px. Never convey meaning by colour alone.

## Upgrade
Built in the shared UI; this card documents existing behaviour.

Expo: `Banner` in `mobile/components/ui/banner.tsx` (info, success, warning, danger, title with optional body and action, announced as an alert).

# Sheet

## Purpose
Bottom sheet on a phone with grabber: picker list and form sheet with sticky footer, plus the centred sheet on desktop

## Anatomy
See `preview.html` for the parts of Sheet and every variant, labelled.

## States
Default, focus, disabled and error states where they apply are shown side by side in `preview.html`.

## Rules
Use tokens from `tokens.json` through `bundle.css`; no hardcoded colours or sizes. Targets are at least 44px. Never convey meaning by colour alone.

## Upgrade
Built in the shared UI; this card documents existing behaviour.

Expo: `Sheet` in `mobile/components/ui/sheet.tsx` adds a grabber, title with a 36 close button, scrolling body, pinned footer, keyboard avoidance and sizes `auto` (up to 75%) and `tall` (92%). Centres as a dialog on wide web.

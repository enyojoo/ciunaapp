# ExpertCard

## Purpose
An expert in the Experts directory and in search.

## Anatomy
72px photo, name with verified icon, headline (profession first), rating and count, language codes (EN, RU, ZH), favourite heart, from-price with unit, next availability line, optional action.

## States
default, favourite, unavailable (greyscale photo, 'No slots this week', Notify me), long Russian text (two-line clamp), unverified and new (no rating), compact suggestion row.

## Rules
Languages are 2-letter codes, never flags, and are filterable. Next availability is shown in the viewer's time zone with the zone name. New experts show 'New' instead of a rating until the first review. Price always says From and the unit (hr, page, session). Unavailable experts stay listed.

## Upgrade
Extends the existing catalog card: adds language codes, next availability, unavailable state, favourite and compact row.

## Code
`web/components/hub/hub-expert-catalog-card.tsx`, `mobile/components/expert-catalog.tsx`

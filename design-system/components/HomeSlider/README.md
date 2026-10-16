# HomeSlider

## Purpose
The Home hero, as a slider. It shows what is new or useful now, and it is the place for ads later.

## Anatomy
Rounded card (radius 18, about 124 px high) with a full-bleed gradient from the service-line art, a white-tinted icon well (top right), title, one line, a link, and dots below. An "Ad" label (top left) appears only on paid slides.

## States
Slide 1 to N with dots; auto-advance every 5 seconds; paused while touched; one slide shows no dots and no auto-advance; empty (no slides: the hero is hidden and the tiles move up); loading shows one gradient placeholder.

## Rules
- Slides are data: title, one line, optional link, optional `ad` flag. Office sets the list and the order. Slides give a next step (refer, weekly pick, back in stock); they must not repeat the service tiles.
- The "Ad" label is required on every paid slide. Nothing else differs for an ad.
- Swipe changes slide; tap opens the link. Auto-advance stops when the user touches the slider and resumes after 8 seconds of no touch.
- Text stays white on the gradient with the shade at the bottom for contrast; titles are 22 px and wrap to two lines, never truncate.
- No orange billboard: the gradient is the service-line colour, not the brand orange.

## Upgrade
Replaces the removed `HubHero` billboard. Shown at the top of Home, under the sticky header, above the service tiles. Search is not on Home. Build notes: `mobile/components/home-slider.tsx`, slides from `mobile/lib/home-slides.ts` (static until Office supplies them), dots and auto-advance in the component.

## Code
`mobile/components/home-slider.tsx`, `mobile/lib/home-slides.ts`

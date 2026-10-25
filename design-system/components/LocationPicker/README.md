# LocationPicker

## Purpose
Lets a customer choose the city that Food, Mart and Experts show content for, from the header of each line home.

## Anatomy
Pill in the nav bar in front of the cart: pin icon, city name, chevron. 36 high, 124 wide, 1 px hairline, surface fill. Tapping opens a bottom sheet: search, "All cities", a short list of popular cities, then the full Russian city list.

## States
all cities (label "All cities"), city chosen, long city name (ellipsis, the pill never grows), sheet with search results, sheet with no match.

## Rules
- Fixed width: a city name never pushes the cart or the title.
- Popular cities (where foreigners live and study) come first; the full list is one search away.
- A choice is remembered on the device and filters stores, products and experts at once. "All cities" clears it.
- The pill label is 15 semibold; the sheet rows are 52 high with a check on the chosen city.

## Upgrade
Replaces nothing: new in this release. Add the pill to Food, Mart and Experts headers only, never to Home.

## Code
`mobile/components/location-picker.tsx`, `mobile/lib/location.ts`, `packages/shared/src/geo/ru-cities.ts`

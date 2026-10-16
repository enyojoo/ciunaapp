# ServiceCard

## Purpose
A bookable service listed on an expert's profile.

## Anatomy
Title, mode chip (Online or In person · city), description, duration, price (hourly, fixed or quote), Book button.

## States
hourly online, fixed in person, quote (Request quote, secondary), fully booked (disabled button with reason), long Russian title.

## Rules
Price follows PriceTag; quote reads 'Price on request'. Book opens the SlotPicker. Quote services start a request, not a booking. In-person services always name the city. A disabled Book states the reason.

## Upgrade
New; the expert profile today lists services as plain rows.

## Code
`web/components/hub/expert-service-card.tsx` (new)

# SlotPicker

## Purpose
Lets a customer choose a date and a start time for an expert booking, in their own time zone.

## Anatomy
Title and service line, horizontal date strip, selected date label, 3-column grid of time slots, time zone line, and a primary button that states the chosen time and price.

## States
Slot selected (orange day and slot, button names the time), nothing chosen (button disabled), unavailable slot (muted, struck through), unavailable day (muted), empty day (message pointing to the next open day), expert in another time zone.

## Rules
Times are shown in the customer's zone with the expert's zone beside it: "Times shown in your time zone (MSK) · Expert in Lagos (WAT)". Tap targets are 48px or taller. The selection is the only orange on the screen besides the primary button. Customer font.

## Upgrade
Matches the slot step of `mobile/components/expert-catalog.tsx`; new is the two-zone line and the empty-day message.

## Code
`mobile/components/expert-catalog.tsx`

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
Built as `mobile/components/slot-picker.tsx`: date strip, three-column 48px time grid, skeleton chips, empty message, the customer's time zone with the expert's zone beside it, and a button that names the chosen time. Unavailable slots are struck through.

## Code
`mobile/components/expert-catalog.tsx`

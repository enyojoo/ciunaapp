# AvailabilityEditor

## Purpose
An expert sets when each service can be booked: weekly hours, slot length and a booking window. Saving rebuilds open slots; booked sessions never change.

## Anatomy
Service select, Schedule settings (time zone, slot length, bookable from and until, "Next 60 days" reset), Weekly hours (a row per day with ranges as two time inputs and a remove button, Copy to other days, Add hours, "Not available" when empty), Next 14 days preview (slots per date in the expert's time zone), sticky save bar. Copy opens a sheet with day toggles. Phones stack everything with icon buttons for Copy and Add.

## States
Default; day with multiple ranges; closed day; overlap error (both ranges marked, message under the day); incomplete range ("Enter both a start and an end time"); window errors (end before start, longer than 90 days); empty week (warning: saving removes open slots); busy saving; saved toast "Availability saved"; copy sheet with selected days.

## Rules
Times are 24-hour and in the named time zone. Errors sit under the offending day in destructive text with an icon. Save is disabled while any error exists. The preview always shows the next 14 days. Customers see times in their own zone; the expert sees MSK or their chosen zone.

## Upgrade
Built today: everything above as `AvailabilityEditor`. New: card captions and the separate preview card layout on desktop.

## Code
`seller/components/expert/availability-editor.tsx`

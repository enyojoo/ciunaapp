# SellerServiceEditor

## Purpose
Create or edit one expert service: what it is, what it costs, how long, how customers join, and how far ahead they can book.

## Anatomy
Sections: Basics with language tabs (title, short description), Pricing (hourly or fixed, amount, currency), Duration (session length; shortest and longest for hourly), Delivery (online, in person, both; meeting instructions), Booking rules (minimum notice, payment deadline with a unit select of minutes or hours, service time zone), Languages. Sticky bar with Unsaved changes, Save draft, Publish.

## States
New (nothing saved, Publish disabled); dirty (Unsaved changes badge); field errors under the field; instructions missing (publish blocked); rejected (reason banner, saving resubmits for review); not yet approved business (publish disabled with a notice); unpublish confirm and the refused case with a count.

## Rules
Meeting instructions are required to publish, not to save a draft. Notice and payment deadline accept zero. Shortest session cannot exceed the longest. The unpublish dialog is destructive-styled and says that existing bookings stay. Labels above fields, errors as sentences with an icon.

## Upgrade
Built in `seller/components/expert/service-form.tsx`. Differs: the two-column desktop layout and the standalone Languages (spoken) chips are new; the built form is one column and has language tabs only for text. The refused-unpublish dialog replaces the built toast.

## Code
`seller/components/expert/service-form.tsx`, `unit-input.tsx`

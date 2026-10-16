# SendAmountField

## Purpose
The lane-style amount input used by Send: a labelled amount with a currency pill, plus the sheet that changes the corridor or currency.

## Anatomy
Plate with a 13px label and a limits hint, a muted currency symbol and the figure in 32px bold tabular numerals, and a 44px pill (flag, code, chevron). One message line under the figure. Two lanes are joined by a round swap marker and followed by a rate line. CorridorPicker: grabber sheet titled Send to, search field, Recent corridors as chips (flag, arrow, flag), All countries rows (32px flag, country, currency code, symbol and receive method, today's rate, check on the selected row), Coming soon rows dimmed.

## States
Default (placeholder 0), focus (primary border and halo on the whole lane), filled, error below the minimum, error over the maximum, error over the monthly remainder (with See limits), disabled, receive lane loading (a dash), long value (steps down to 24px, then ellipsis), single currency (no chevron), another receive currency, pair with rate line. Picker: default, search match, no match with an action and a coming-soon list, first-load skeleton, pay-currency picker.

## Rules
Both lanes are editable; the last edited lane is the source. Limits come from Office and the customer's verification level, never hard-coded. Errors are one sentence under the figure with an icon and say what to fix; the quote hides and Continue disables. A flag always travels with its code. Search matches country, currency name and code. Corridors that are not open are shown only as Coming soon and cannot be picked. No provider names.

## Upgrade
Differs from the built app (`mobile/components/send/send-amount-step.tsx`, `send-currency-chip.tsx`, web `components/send/currency-picker-sheet.tsx`): lanes, pill, inline error and the searchable picker are built; Recent corridors, Coming soon rows, rate per row, the monthly-remainder error with a Limits link, the long-value shrink rule and the request-a-corridor action are New.

## Code
`mobile/components/send/send-amount-step.tsx`, `web/components/send/currency-picker-sheet.tsx`

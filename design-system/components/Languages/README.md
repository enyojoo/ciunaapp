# Languages

## Purpose
Shows that every customer and seller screen works in all six languages (en, ru, fr, es, zh, pt) and defines the language picker.

## Anatomy
Three reference snippets (order card, booking confirmation, error) rendered per language; a language row (label, current language in its own script, chevron); a compact pill (globe, code); a bottom-sheet list with one row per language (own-script name, English name, check or radio).

## States
Picker: unselected (radio), selected (check, `primary-text` name). Strings that run longest (Russian, French) wrap to extra lines; Chinese uses 1.5 line height. Fallback: a missing key shows English, never the key.

## Rules
- Every string exists in en, ru, fr, es, zh, pt; whole strings with placeholders, never concatenated fragments.
- Layouts survive 40% longer text: buttons and titles wrap, nothing clips or overlaps.
- Languages are named in their own script. Default is the device language; changing applies immediately.
- Names, addresses and business names stay in their original script.
- Money, dates and times come from the shared formatters, with time zones.
- Same voice everywhere: polite, direct, no slang.

## Upgrade
Chinese and Portuguese customer-app translations exist (commit `51db25eb`) but are not yet in the language lists; wire zh and pt into the picker, Seller and Office.

## Code
`packages/shared/src/i18n/`, `app/src/i18n/`

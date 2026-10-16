# CustomerRecipients

## Purpose
Where a customer manages the people and bank accounts they send money to, from the Account tab and from the Send flow.

## Anatomy
List: header with back, full-width Add recipient button, search field, recipient cards (initials avatar with flag badge, name, masked account, bank, trailing delete button). Add and Edit: currency field (flag, code, name; chevron or lock), then fields by currency (account name, bank name, account number; USD adds routing number, account type and address; GBP sort code; EUR IBAN and SWIFT/BIC), sticky primary button. Currency picker sheet with flag, code, name, symbol.

## States
List; first-load skeleton; empty; search with no match; add (default, focused, error, disabled); USD with the longer field set; currency sheet; edit with the currency locked; delete confirm dialog naming the recipient; delete blocked toast.

## Rules
Fields come from the payout currency; labels say what the bank calls them and hints give the shape ("10 digits"). Errors say what to fix and sit under the field; the form never clears. Row tap edits; the trash icon is a 48px target and opens a confirm that names the person. Deleting a recipient does not remove history. No provider names.

## Upgrade
Built in `mobile/app/recipients/index.tsx`: list, search, empty state, in-app delete dialog naming the recipient, form.

## Code
`mobile/app/recipients/index.tsx`, `mobile/app/recipients/form.tsx`, `mobile/components/recipient/recipient-form-fields.tsx`

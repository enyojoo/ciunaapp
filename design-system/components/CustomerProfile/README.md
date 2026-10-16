# CustomerProfile

## Purpose
Where a customer sees and edits who they are in Ciuna: name, contact details, language, base currency and photo, and where they can delete their account.

## Anatomy
Header with back. Photo (initials avatar, camera button), name and email. Profile information plate with an Edit link and rows: First name, Last name, Email address (locked), Phone number, Language, Base currency (flag and code). Hint under the plate. Delete account as a quiet destructive row. Edit mode swaps rows for fields and shows Discard and Save in a sticky bar. Sheets: Change photo (Take photo, Choose from library, Remove photo) and Language (six languages in their own script).

## States
View; edit (focused); edit with a phone error; saved toast; change photo; language sheet; delete account confirm; delete blocked by open items; Chinese; saving in progress (phone and desktop); desktop web view.

## Desktop web
At `app.ciuna.com/more/profile` the page keeps the top nav, with the photo plate and section links (Profile, Verification, Referrals) on the left and the information plate on the right (rows in view, a two-column form in edit). Discard and Save sit at the foot of the plate. While saving, fields are read-only, Discard is disabled and Save shows a spinner and "Saving"; the page does not change until the response returns.

## Rules
Email cannot be changed; say so and say who to contact. Errors name what to fix ("Enter a 10-digit phone number after +7"). Save is disabled until valid. Destructive actions are in red text only on their own row and dialog; the dialog names the action and states what is deleted and what is retained by law. Language changes immediately and is saved on the device and on the account. Names accept any script.

## Upgrade
Built in `mobile/app/profile.tsx`: photo sheet, edit mode, base currency, language row, email hint, in-app confirmation dialogs. Account deletion is blocked on a backend endpoint.

## Code
`mobile/app/profile.tsx`, `web/app/more/profile/page.tsx`

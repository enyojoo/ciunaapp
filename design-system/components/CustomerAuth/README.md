# CustomerAuth

## Purpose
Getting a customer into the app: sign in, register and the PIN lock.

## Anatomy
Top row with logo (or back) and a language chip. Sign in: Apple and Google outline buttons, Or, email, password with eye, Forgot password, one orange Sign in, sign-up footer. Register: same social row, full name, email, password with live rules, terms checkbox, Create account. PIN: avatar, greeting, four dots, 72px keypad, Forgot PIN link.

## States
Default; wrong password (inline under the field); account locked (warning banner, form disabled); register with a duplicate email; PIN entering; PIN wrong (red dots, attempts left); Russian; Chinese with the language sheet open.

## Rules
Errors say what to fix and sit beside the field. The email is never cleared. Social buttons are outline, never orange. PIN dots fill in ink. Keys are 72px. Language can be changed before signing in and is saved on the device.

## Upgrade
Built in `mobile/app/auth/login.tsx` and `register.tsx`: inline notice above the form (red for a failed attempt, amber for a locked account) that clears on edit, language chip in the top bar, social sign-in, forgot password.

## Code
`mobile/app/auth/login.tsx`, `mobile/app/auth/register.tsx`, `mobile/components/auth-chrome.tsx`

# CustomerPin

## Purpose
A four-digit app lock that opens Ciuna quickly after idle time without typing a password.

## Anatomy
Setup: back, title, one-line instruction, four dots, 72px keypad, progress dots (create, confirm, done). Unlock: initials avatar, "Welcome back, name", instruction or error line, four ink dots, keypad with a biometric key in the bottom-left corner, a Log out link. Locked: warning plate with the wait time and a disabled keypad. Security settings: PIN lock switch, Change PIN, biometric unlock switch.

## States
Create (empty, two digits); confirm; mismatch; change with a wrong current PIN; unlock (entering, wrong with attempts left, too many attempts); Face ID prompt (system sheet); Russian; settings.

## Rules
Dots fill in ink and turn destructive red on an error, always with a message in words. The PIN submits itself on the fourth digit. After a wrong PIN the dots clear. Biometric opens first and falls back to the keypad. Keys are 72px and the whole keypad meets the 48px target. Log out is always available. The PIN never appears in text.

## Upgrade
Differs from the built app (`pin.tsx`, `pin-setup.tsx`): errors move from a toast to the line under the title; the avatar and name greeting, attempts left, locked state and the biometric key in the keypad are New (biometric unlock runs on launch today without a visible key); the Security settings page groups PIN lock, change and biometrics.

## Code
`mobile/app/pin.tsx`, `mobile/app/pin-setup.tsx`, `mobile/components/pin-keypad.tsx`

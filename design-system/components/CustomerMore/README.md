# CustomerMore

## Purpose
The Account tab: who is signed in, the few settings a customer needs, and a way out.

## Anatomy
Title, identity plate (avatar, name, verified tick, email, Profile chip), Account group (Verification with status chip, Favourites, Refer a friend in teal, Login PIN), App group (Language with current language, Recipients, Support, Legal), Sign out, version line. Language picker is a bottom sheet listing English, Русский, Français, Español, 中文 and Português in their own script with the English name beneath.

## States
Verified; verification in review (amber, no tick); action needed (amber with icon); language sheet open; Russian and Chinese copy; sign-out confirmation dialog. Rejected verification uses the destructive chip.

## Rules
Identity first. Rows are 52px with a 32px neutral icon tile; only Refer is tinted (teal). Chips use status colours with a word and icon. Orange is not used on this screen except the active tab. Language applies immediately and is stored on the device. Sign out always confirms; its button is the only red fill.

## Upgrade
Differs from the built app (`more.tsx`): tab is labelled Account to match Home; adds Favourites; Privacy and Terms merge into one Legal row; the verified tick is green, not orange; Refer is teal; the identity "Open" chip becomes "Profile"; language sheet lists six languages (Chinese and Portuguese not yet wired into the app lists); sign-out uses an in-app dialog.

## Code
`mobile/app/(app)/more.tsx`, `mobile/components/language-picker.tsx`

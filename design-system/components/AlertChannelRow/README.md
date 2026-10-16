# AlertChannelRow

## Purpose
One place per channel (email, Telegram) where a seller sees how they get order alerts and mutes the types they do not want.

## Anatomy
Icon tile, channel name with address or handle, state badge, an instruction note for the current link step, a primary action, and a list of mute switches by alert type.

## States
Email on; Telegram not linked (Connect button), link opened and waiting (Open link again, Cancel, 10 minute note), linked (handle, switches, Disconnect); a muted switch is off.

## Rules
Switches appear only for a working channel. Not linked is neutral, waiting is warning, linked is success, each with a word. Tap targets stay 48px high on phones. Alert text never shows customer addresses in the preview.

## Upgrade
Matches `seller/app/(shell)/settings` alerts; new is the explicit waiting state and per-type mute list.

## Code
`seller/app/(shell)/settings`

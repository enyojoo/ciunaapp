# TelegramAlert

## Purpose
Sellers get new orders and booking requests in Telegram within seconds, the channel they already watch all day. The bot only alerts; it never takes orders or money actions in chat.

## Anatomy
Chat header (Ciuna mark, "Ciuna Seller", bot). Linking: the seller opens the bot from Settings, which sends `/start <code>`; the bot answers "Connected. You will get new orders and booking requests here." Alerts: bold title, one sentence (same strings as the seller email), and one inline button "Open in Ciuna Seller". `/stop` turns alerts off and says how to turn them back on.

## States
Link flow, new order, payout paid (new booking, message, approval and suspension alerts use the same shape), `/stop` reply. Shown in English and Russian; the bot answers in the language the seller set in Ciuna Seller.

## Rules
- The mockup uses neutral chat styling, not Telegram's brand assets.
- One inline button per alert, a deep link into the seller portal.
- No customer phone numbers or addresses in alerts; the order opens in Seller.
- No emoji and no exclamation marks, so alerts read the same as email and push.
- The link code is single-use and expires; a wrong code gets "That code has expired. Get a new one in Settings."

## Upgrade
Alert copy and the six languages are built in `api/lib/merchant/notify-messages.ts`. New or to confirm: the exact bot replies for linking and `/stop` shown here, and the bot answering in the seller's language.

## Code
`api/lib/merchant/notify-messages.ts`

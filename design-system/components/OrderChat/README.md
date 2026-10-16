# OrderChat

## Purpose
A plain text conversation between a customer and the seller about one order. It replaces phone calls and WhatsApp for "where is my order" and "can you change this".

## Anatomy
- Header: back, seller avatar and name, a response-time line, info button. Under it an order strip (order number, items, total, status badge) that links to the order.
- Messages: incoming grey bubbles on the left, outgoing primary bubbles on the right, a time under each, day separators, "Seen 12:54 PM" under the last outgoing message once read.
- Quick replies (chips): "Where is my order?", "Change delivery time", "Allergy question". They fill the composer, they do not send.
- Composer: rounded input, send button (48px tap area), live counter "n / 2000", one hint line for errors.
- Desktop: the same conversation as a 380px side panel beside the order detail; Enter sends, Shift+Enter adds a line.

## States
Conversation, Empty ("Ask the seller a question about your order"), Closed (neutral banner "Chat closed on Oct 28, 2026" with Report a problem; history stays readable), Not yet available ("Chat opens once your order is paid", disabled composer, Complete payment), Rate-limited (amber banner "You are sending messages too fast", draft kept, send disabled), Send error (bubble marked "Not sent" with Retry, text kept), Loading (three bubble skeletons). Unread: a dot on Message seller in OrderTracking and on the order row in Activities.

## Rules
- 2000 characters max; the counter turns destructive at the limit and the send button disables.
- The chat opens when the order is paid and closes 14 days after completion; cancelled and refunded orders keep it readable and closed.
- Never drop a draft on error, offline or rate limit.
- Plain text only, no attachments in v1. No payment details in chat; a gentle line appears if a card number pattern is typed.
- Seen shows once per message, only on the last outgoing one.

## Upgrade
Built in `mobile/app/orders/[id]/chat.tsx`: conversation, day separators, Seen, counter, closed banner (with date), rate-limit notice, send retry, card-number hint, skeleton, not-yet-available and empty states, and quick-reply chips that fill the composer (never send). Quick replies are customer-visible (owner decision, 2026-10-17). Not built: desktop side panel, "Report a problem" in the closed banner.

## Code
Mobile: `mobile/app/orders/[id]/chat.tsx`. Web: `web/components/hub/order-chat.tsx` (not built).

# ChatBubble

## Purpose
Messages between a customer and a seller or expert about an order or booking.

## Anatomy
Header (who, order reference, reply time), day separators, bubbles (customer right in primary with white text, other side white with edge) with time inside, Seen line, system notices, quick replies, composer with counter.

## States
conversation, closed chat (notice, composer disabled), composer empty (Send disabled), typing, near limit (counter from 1,900), at limit (2,000, error colour), offline, long Russian and Chinese text.

## Rules
2,000 characters per message. Seen shows only under the last customer message. System notices are neutral, centred and never look like a bubble. Quick replies are chips and fill the composer, they do not send. Closed chats keep history, disable the composer and say how to proceed.

## Upgrade
Extends the `.bubble` markup; adds day separators, Seen, counter, quick replies and closed state.

## Code
`web/components/chat/`, `mobile/components/chat-thread.tsx`

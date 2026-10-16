# SellerMessages

## Purpose
Let a seller talk to customers about a paid order without leaving the portal.

## Anatomy
Thread row (avatar, customer, last message, time, order number, order status badge, Chat closed chip, unread count). Thread header with order link. Bubbles (customer left neutral, seller right primary, time, Seen). Quick-reply chips. Composer with a 2000 counter and Send. Closed notice replaces the composer.

## States
Unread thread; read thread; closed thread; empty list ("No messages yet"); no access; chat unavailable before payment; message too long; rate limited; sending.

## Rules
Unread is a number as well as weight. Status badges follow the global vocabulary. Closed chats keep history and show why they closed. Quick replies fill the composer; they never send on tap. Counter is announced politely and turns into text when over the limit.

## Upgrade
Built in `seller/app/(shell)/messages/` with `seller/components/messages/`. Differs: the desktop split view is new (built opens a separate page per thread), and the day separator is new.

## Code
`seller/app/(shell)/messages/`, `seller/components/messages/`

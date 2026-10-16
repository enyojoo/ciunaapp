# CustomerSupport

## Purpose
Everything a customer needs to get help: self-serve answers, a way to write to a person, and an AI assistant for quick questions.

## Anatomy
Support page: Get in touch (Chat with us, Email support, Telegram chat), Frequently asked questions (accordion), Support hours. My requests: filter chips, request rows (icon, title, last line, status badge, date), New request. New request: topic chips, related order, message with counter, screenshot, Send request. Thread: bubbles (customer orange with white text, agent neutral), composer. Assistant: AI badge in the header, greeting, suggested questions, bubbles with optional action row, typing dots, composer.

## States
Support default; FAQ expanded; outside hours; requests list; new request default and error; thread; assistant first open, conversation, thinking, unavailable (with retry and contact), handed to a person with a secure-account banner.

## Rules
Say what happens and when: hours include the time zone (MSK). Request status words follow the system: Awaiting you and In review are warning, Resolved is success. The assistant never invents amounts: it quotes the order and links to it; "Talk to a person" is always one tap away. An AI answer is labelled and carries a short accuracy note. Bubbles never use orange for incoming messages. No provider names.

## Upgrade
Differs from the built app: `support.tsx` has contact rows, FAQ and hours only; in-app chat with a person, requests list, new request form and thread are New. `assistant.tsx` is today a single "run errands" notes box with Submit; the conversational assistant, suggestions, actions and handoff are New. The Support pill in the Home header uses the message-circle-question icon.

## Code
`mobile/app/support.tsx`, `mobile/app/assistant.tsx`

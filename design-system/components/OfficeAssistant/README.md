# OfficeAssistant

## Purpose
The Assistant page in Office. Today it is the queue where ops answer customers' errand requests from the app. The card adds the other half people expect from "Assistant": an AI assistant for ops that answers questions from live Office data and proposes actions, with the queue as its second tab.

## Anatomy
- Page head: title, one line saying answers come from live data and nothing changes without confirmation, New chat. Tabs: Ask, Requests (count).
- Ask: conversation card and a right rail. The rail lists what the signed-in role can read, what it cannot (with the owning role), the "data as of" time and the role.
- Messages: the ops person's message (neutral bubble, right); the assistant's answer with an AI badge, a tool line saying what it looked up and that it was read only, a short sentence, a result table with a footer (source, filters, time, link to the full page), a count note ("Showing 5 of 7"), then suggested actions as secondary buttons.
- Proposed action card: names who is affected and what is recorded; Cancel and a primary button that names the action. After confirming: a success banner with audit log time, View in audit log and, where reversible, Undo.
- Composer: input, Send, and an accuracy note.
- Requests (built): table of Created, Type, Status badge, Request, Quote and Actions (status select, Set quote, Admin notes).

## States
Conversation with tool result and suggestions; action proposed; action done; requests loaded; requests loading (skeleton rows), empty, error with retry; tool error inside a conversation (names the lookup, says nothing changed, Try again and Open the page, a reference for support); assistant unavailable (the rest of Office still works, Try again, Open Requests, last checked time); role-limited (support): a Read only banner, the assistant says which role the missing data needs and offers only reading actions.

## Rules
- The assistant never changes data on its own. Any suggested action that writes opens a confirmation card first, and every action lands in the audit log with who asked and what ran.
- Tools are read only unless the role has the write permission. A control the role may not use is hidden, not disabled; the assistant says which role owns the data it cannot show.
- It quotes rows it fetched, with source and time, and never invents amounts or names. A result table shows at most five rows and links to the full page.
- Money in tables uses the system format (`₽2,500`), not `2500 RUB`. Status words follow the vocabulary: Submitted, Quoted and In progress are warning, Completed is success, Cancelled is neutral.
- Office may name payment providers; this page does not need to.
- Skeleton only on a first load; a refresh keeps rows on screen. Errors say what failed and that nothing changed.

## Upgrade
Built (`office/app/assistant/page.tsx`): only the Requests queue, and the sidebar already lists "Assistant". Differences in the queue: today it shows loading as the text "Loading…", a raw JSON payload in the Request column, the quote as `2500 RUB`, raw status values (`in_progress`) in a plain outline badge, `window.prompt` for Set quote, and the error text in red without a retry.

New: the whole Ask tab (conversation, tool results, suggested actions, confirmation, role-limited and unavailable states), the tabs, status badges with icons, the readable request summary, an in-page Set quote form. The ops AI assistant has no API yet; the card is a proposal. Check the role names against `office/components/layout/office-dashboard-layout.tsx` before building the role rail.

## Code
`office/app/assistant/page.tsx`, `api/app/api/admin/assistant/requests/route.ts`

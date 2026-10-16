# Ciuna Design System

The design system for every Ciuna surface: the **customer app** (Expo on iPhone, Android and the web, plus `web/` for app.ciuna.com), **Ciuna Seller** (`seller/`, the merchant portal), **Office** (`office/`, ops), and documents (receipts, email).

`tokens.json` is the single source of truth. Edit it, run `npm run design:sync`, and web, Seller, Office and Expo all update. `npm run design:check` fails on drift and on any text pair under WCAG AA.

- **Start here:** this file, then `guides/` and `tokens.json`.
- **Components:** `components/<Name>/README.md` specs each component, with an **Upgrade** line for what differs from today's code. `npm run design:cards` checks every spec has the required sections.
- **See it:** `python3 -m http.server 4871 -d design-system`, open http://localhost:4871/viewer.html (colours, contrast and status vocabulary rendered from `tokens.json`).
- **Order of work:** `guides/60-implementation-plan.md`.

Ciuna is a super app for **foreigners living in Russia** — African, Chinese, Latin American, Central Asian and other communities. It should feel warm, trustworthy and quick: a market you trust with your money.

## Principles

1. **Neutrals carry the surface. Orange signals intent.** Paper canvas, white plates, ink text. Orange (`brand-primary`) marks the one thing to do: buttons, active tabs, selected state, the logo. Never fill a page or a large card with orange. No giant orange billboards.
2. **Ink on orange, never white.** White on `#F97316` is 2.8:1 and fails AA. Every orange fill carries `primary-foreground` (ink, 6.3:1). Orange as *text* or a link uses `primary-text` `#C2410C` (5.2:1). Hover and press use `primary-hover`.
3. **One status vocabulary, one colour pair each.** Completed, Paid, Live, Verified → green. Pending, Preparing, In review, Awaiting → amber. Failed, Rejected, Overdue → red. Draft, Paused, Cancelled, Refunded → neutral. Orange is never a status. A status always carries a word or icon, never colour alone.
4. **Money has one format.** Through `formatMoney` / `Amount` only. Symbol first, comma thousands, dot decimals, tabular figures, true minus: `₽12,500`, `$24.50`, `€9`, `−₽450`. No `.00` on whole amounts in lists; breakdowns that add up always show cents. Currencies with no minor unit never show decimals. Rates use symbols on both sides. Pickers name a currency by flag and code.
5. **Instant by default.** Open with cached data on screen; skeleton only on a true first load with no cache, never over cached content.
6. **Accessible without exceptions.** Text meets AA, controls and focus rings meet 3:1, tap targets are 48px, nothing relies on colour alone. Works at 200% text size.
7. **Built for mixed languages.** Every string is in `en`, `ru`, `fr`, `es`, `zh`, `pt`. Layouts survive 40% longer text. Names, addresses and listing titles accept any script.
8. **Light only.** No dark mode on any Ciuna surface (Office keeps its legacy `.dark` rules until removed).

## Content fundamentals

- **Voice:** plain, calm, specific. Say what happens to the money and when. Warm, not cute.
- **Casing:** sentence case for titles, buttons, tabs. Product names keep capitals: Ciuna, Ciuna Seller, Send, Experts.
- **Person:** address the user as "you"; the product speaks as the system.
- **Confirmations ask a direct question:** "Reject this order?" Buttons name the action: "Reject order", never "OK".
- **Errors say what to fix:** "Enter a 10-digit phone number", not "Invalid input".
- **No provider names** (YooKassa, Bitbanker, …) on customer or seller screens, emails, push or errors. Office is the only place providers are named.
- **No emoji** in product UI. No exclamation marks on money states.
- **Dates:** "Sep 24" in lists; "Sep 24, 2026 • 2:14 PM" in details; time zone on cut-offs: "6:40 PM MSK". Bookings always show the viewer's time zone and the expert's.
- **Seller language:** merchants are "sellers" in UI; the portal is "Ciuna Seller"; a seller's shop is a "store", an expert's page is a "profile".

## Colour

See `tokens.json` for every value and its usage note.

- **Canvas:** `paper` behind `surface` plates. Text is `ink`; secondary text is `muted`; `subtle` is for icons and placeholders only.
- **Primary:** `brand-primary` fill + `primary-foreground` label; `primary-hover` for hover/press; `primary-text` for links and small orange text; `primary-tint` + `primary-border` for selected rows and callouts.
- **Status:** each status has a solid fill (white label), a `-surface` ground and a `-text` colour. Badges use surface + text. Solid fills only for emphasis (a destructive confirm button).
- **Refer:** `refer` teal pill; never a status.
- **Controls:** edges use `input-edge` (3:1); decorative dividers use `hairline`.
- **Scrim:** `scrim` at 55% behind dialogs and sheets.

## Type

Geist on web (customer web, Seller, Office); the system font on native (SF Pro / Roboto), by design. Native scale: title 24, body 16, label 15, meta 13. Web scale follows Tailwind with the fluid body. Numbers are tabular wherever money or quantities align.

## Shape and motion

Control radius 12, card 16, sheet 24, pill 999. Tap target 48. Sheets 180ms, fast 150ms, normal 220ms. Respect reduced motion.

## Surfaces

| Surface | Shell | Notes |
| --- | --- | --- |
| Customer app (Expo + `web/`) | Tab bar on phones; sidebar from tablet | Paper canvas, white plates, compact header, 2-col tiles. See `guides/20-customer-app.md`. |
| Ciuna Seller (`seller/`) | Bottom nav on phones; sidebar from 768px | Responsive web portal, installable PWA. One task per screen on phones. See `guides/30-seller.md`. |
| Office (`office/`) | Sidebar + dense tables | Ops tool: dense, keyboard-first, the only place providers are named. See `guides/40-office.md`. |
| Documents | White page, logo top-left | Receipts, invoices, email. See `guides/50-documents.md`. |

Do not mix languages: no dense Office tables on the customer app; no giant tiles in Office.

## Implementation

Tokens flow `tokens.json` → `packages/shared/src/design/tokens.generated.{ts,json}` → generated blocks in `web|office|seller/app/globals.css` and the Expo theme and Tailwind config. Shared web components live in `packages/ui-web`. Never hardcode hex in a component; use a token. Components that need orange text use `text-primary-text`; orange fills use `bg-primary text-primary-foreground`.

# Kickoff: build the design into the apps

Use this to start a new session. Paste the prompt at the bottom.

## Read in this order
1. `docs/design-to-build-plan.md`: the five stages (A to E) and the order of work.
2. `design-system/guides/80-decisions.md`: every product decision is made; do not reopen them.
3. The surface plan for the package you pick:
   - `docs/build-plan/api-and-data.md` (WP0 to WP13)
   - `docs/build-plan/office.md` (O0 to O12)
   - `docs/build-plan/seller.md` (P0 to P11)
   - `docs/build-plan/customer-app.md` (WP1 to WP13, native `mobile/` and web `web/`)
   - `docs/build-plan/send.md` (S0 to S7)
   - `docs/build-plan/launch-readiness.md`
4. The card you are building: `design-system/components/<Name>/preview.html` and README (its Upgrade section says Built, differs or New). Viewer: `design-system/viewer.html`.

## Stage A task list (start here; items are independent unless noted)
| # | Task | Plan section | Exit test |
| --- | --- | --- | --- |
| A1 | Data baseline migration for tables with no DDL and core tables; CI Postgres job applies the chain twice | api-and-data WP0 | `npm run test:db` green; schema dump identical on second apply |
| A2 | Permission model: one matrix, `GET /api/admin/me`, convert legacy admin routes to `adminRoute(permission)`, client `<Can>` | api-and-data WP1, office O0 | matrix test: each role gets 403 or 200 per route |
| A3 | Wire `zh` and `pt` into the language lists (`mobile/lib/i18n.ts`, `web/lib/i18n/config.ts`, `web/lib/auth-context.tsx`) | customer-app WP1 | six languages selectable on native and web, strings render |
| A4 | Shared UI primitives and one status vocabulary (`packages/ui-web`, mobile status chip from tokens) | customer-app WP2, seller P3, office O3 | `design:check`, `design:cards`, `tsc` green |
| A5 | Seller test harness (Playwright on mock mode) and the 5-item phone nav fix | seller P0, P1 | 375px: 5 nav items, More reaches Earnings and Reviews |
| A6 | Rate limits (auth, chat, search, checkout, uploads) | api-and-data WP6 | burst test returns 429 with `Retry-After` |
| A7 | Seller alert emails: logo and recipient time zone | seller P2 | notify tests updated and green |

Then Stage B (see master plan).

## Settled (do not ask)
Numbers are Office-editable seeds, translation is Azure AI Translator, Telegram is built but off until a bot token exists, account-deletion wording is final. See the end of `design-system/guides/80-decisions.md`. There is one Supabase project (production): apply SQL with a backup first (`supabase/deploy/seller-portal-all.sql`), never assume a staging copy.

## Working rules
- The card is the contract. If the card is wrong, fix the card first, then the code.
- Numbers on cards are samples; read them from Office or the database.
- Native apps in stores cannot be force-updated: additive API changes only, checkout and payment contracts frozen, new screens behind flags.
- No provider names on customer or Seller screens; Office only.
- Each package ends with its exit test, `npm run design:check` and `npm run design:cards`, and a screenshot next to the card. Then change the card's Upgrade line to "Built".
- Do not build items listed under "Do not build yet" in the plans.
- Run independent packages as separate sessions in separate worktrees; they touch different files.

## Prompt to paste into the new session
```
Work in /Users/a1/Projects/ciunaapp. Read docs/build-plan/00-kickoff.md, then docs/design-to-build-plan.md and design-system/guides/80-decisions.md. Execute Stage A of the plan: tasks A1 to A7, using the surface plans in docs/build-plan/ for detail. Decisions are already made; do not ask about them. Follow the working rules in the kickoff file. Start with A1 and A2 (API and data), run A3 to A7 as parallel work where files do not overlap, verify each with its exit test, commit per task, and report what is done, what failed, and anything that needs an outside input (only provider keys: Azure Translator, Expo push; Telegram is deferred).
```

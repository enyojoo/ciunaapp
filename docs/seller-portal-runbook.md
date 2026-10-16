# Ciuna Seller: runbook

What exists, how to run it, and what must be set before it can take real money. Plan and rationale: [seller-portal-and-design-system-plan.md](./seller-portal-and-design-system-plan.md).

## Pieces

| Piece | Where | Notes |
| --- | --- | --- |
| Design system | `design-system/` | `tokens.json` is the source. `npm run design:sync` regenerates web/office/seller CSS, the Expo theme and Tailwind config. `npm run design:check` and `npm run design:cards` gate drift, contrast and specs. |
| Shared UI | `packages/ui-web` | Used by Seller. Web and Office still use their own copies; migrate screen by screen. |
| Seller portal | `seller/` | Next.js, responsive web, installable (manifest). Port 3003. |
| Merchant API | `api/app/api/merchant/**` | Membership-checked on the server (`api/lib/merchant/auth.ts`). |
| Office APIs | `api/app/api/admin/{merchants,kyb-profiles,audit,fee-rules,fee-plans,payouts,payout-methods,marketplace-settings}` | Roles in `api/lib/admin-roles.ts`. |
| Office pages | `office/app/{merchants,kyb,audit,finance,fees}` | |
| Migrations | `supabase/migrations/20261016100000_merchants_foundation.sql`, `20261016110000_ledger_fees_payouts.sql`, `20261016120000_seller_notifications.sql`, `20261016130000_reviews.sql`, `20261016140000_order_messages.sql`, `20261016150000_marketplace_analytics.sql`, `20261016160000_discovery.sql` | Additive. Apply in order, after the marketplace migrations. |

## Before first deploy

1. **Apply both migrations** to staging, then production. They backfill an Office-managed merchant for every existing vendor and expert, so nothing disappears from the customer app. Verify afterwards: `select count(*) from hub_vendors where merchant_id is null` should be 0.
2. **Env on `api`:** `MERCHANT_PAYOUT_KEY` (32 random bytes, base64: `openssl rand -base64 32`), `CRON_SECRET` (already used by the FX cron). `MARKETPLACE_TOKEN_KEY` is accepted as a fallback for the payout key, but use a separate key. Losing the key makes stored payout details unreadable.
3. **Env on `seller`:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SELLER_URL` (see `seller/env.example`). Never set `NEXT_PUBLIC_SELLER_MOCK` outside local review.
4. **API CORS:** `seller.ciuna.com` is allowed by default; set `NEXT_PUBLIC_SELLER_URL` on `api` for other hosts.
5. **Vercel project for Seller:** root directory `seller`, install from the repo root (workspaces), framework Next.js, domain `seller.ciuna.com`.
6. **Alerts (email + Telegram):** `SES_REGION`, `SES_FROM_EMAIL` are already used for customer email. For Telegram create a bot with @BotFather and set on `api`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (without @), `TELEGRAM_WEBHOOK_SECRET` (random string). Register the webhook once:
   `curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" -d url=https://api.ciuna.com/api/webhooks/telegram -d secret_token=$TELEGRAM_WEBHOOK_SECRET`. Without these, email still works and Seller hides the Connect button. Alerts are rows in `seller_outbox` created by database triggers; `/api/cron/seller-notifications` (every minute) sends them with retry/backoff.
6b. **Cron:** `api/vercel.json` schedules `/api/cron/merchant-money` every 15 minutes (releases earnings after the hold, backfills missing earnings) and `/api/cron/seller-notifications` every minute. Vercel Hobby only allows daily crons; use Pro or call the endpoint from another scheduler with `Authorization: Bearer $CRON_SECRET`.
7. **Storage:** buckets `merchant-assets` (public) and `merchant-documents` (private) are created on first upload by the API.
8. **Launch commissions:** the migration seeds 8% food, 6% mart, 12% experts as placeholders. Set the real numbers in Office (Fees) before approving the first merchant. Hold days default to 2, minimum payouts per currency are in Office (Fees, settings).
9. **Office roles:** existing admins with role `admin` behave as `ops`. Assign `finance` and `compliance` roles to the right people; only `super_admin` edits fees and settings.

## Money rules in one place

- Commission is computed on the item subtotal only (delivery fees go to the seller in full), frozen when the seller accepts, and posted to the ledger when the order is fulfilled.
- Earnings sit in *pending* for the hold period, then *available*. A payout request moves money to *in payout*; Office marks it paid with a bank/SBP reference. Rejected or cancelled requests return the money.
- Card numbers are not accepted as payout destinations. Methods are SBP and bank accounts; "Withdraw via Ciuna Send" is designed but not built.
- Payout methods must be verified by finance before the first payout.
- The ledger is append-only and every posting balances to zero (enforced in SQL; tested in `api/tests/merchant/database.test.mjs`).

## Local development

```bash
npm ci
npm run dev:api                     # port 3002 (needs api/.env)
npm run dev -w seller               # port 3003 (needs seller/.env)
```

**Review without a backend:** set `NEXT_PUBLIC_SELLER_MOCK=1` in `seller/.env`, restart, and open `http://localhost:3003/?as=store` or `?as=expert` (add `&status=draft|in_review|rejected` to see other states). This loads `seller/public/dev-mock.js`, which fakes a signed-in seller and canned API responses.

## Tests

```bash
npm run design:check && npm run design:cards
npm run test -w @ciuna/shared                       # money formatting
npm run test:merchant -w api                        # rules, fees, products, expert helpers, and SQL ledger/payout integration
npx tsc --noEmit -p seller && npx tsc --noEmit -p api && npx tsc --noEmit -p packages/ui-web
```

## Known gaps

- Customer-app UI for reviews, order chat, search and favourites (the APIs and Seller/Office sides exist; see status in the plan doc).
- Order chat has no machine translation (no provider configured); messages store their language.
- Customer time zone is not stored on bookings; the seller sees the service zone and their device zone.
- Variants and multi-image display on the customer side need checkout and catalog changes.
- No automated payout rails yet; payouts are manual in Office.
- Web push is not built (email and Telegram alerts are). The portal also polls every 30 seconds and puts the new-order count in the tab title.

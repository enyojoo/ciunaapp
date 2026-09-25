# Marketplace implementation and release gates

This implementation replaces cart, direct-product and Expert checkout orchestration with the shared `/api/hub` contract. It keeps historical transactions and separates payment from fulfillment in the new order record. New creation is disabled unless the API enables a service line.

## Components

- `packages/shared/src/marketplace`: checkout contract, integer/decimal pricing, deadlines, persisted submission and order resume.
- `api/lib/marketplace`: quotes, validation, order reads, payment recovery, encrypted native replay, provider verification and worker.
- `supabase/migrations/20260925090000_marketplace_lifecycle.sql`: atomic order/stock/slot operations, audit/outbox, refunds, leases, direct-write guards and overdue detection.
- Customer checkout and order components in `web/components/hub` and `mobile/components`; `/pay/:id` resumes the authoritative order.
- `/marketplace` in Office: proof review, acceptance, fulfillment, payment exceptions, refunds, assignment, overdue orders, failed-job retries and fulfillment configuration. Food and Mart create/edit use the same form.

## Configuration

API environment:

- `MARKETPLACE_CHECKOUT_LINES`: optional allow-list. **Empty (default) = Food, Mart, and Experts may check out**, subject to Office **Settings → Hub service lines → Enabled**. Set e.g. `food` only for an API-level restrict. Changing this does not turn off callbacks, worker recovery, existing-attempt completion or refunds.
- `MARKETPLACE_WORKER_SECRET`: random Bearer secret, mirrored in Vault.
- `MARKETPLACE_TOKEN_KEY`: base64 32-byte key (`openssl rand -base64 32`). Back it up securely; changing it while native replay records exist makes them unrecoverable. Tokens are AES-256-GCM encrypted, bound to the attempt ID, omitted from responses/logs, and cleared when a provider reference is persisted or an attempt terminates.
- Existing YooKassa shop/secret configuration, `NEXT_PUBLIC_APP_URL`, service-role Supabase access and SES settings remain required.
- Native builds also require the existing `EXPO_PUBLIC_YOOKASSA_SHOP_ID`, `EXPO_PUBLIC_YOOKASSA_CLIENT_KEY` and linked `react-native-yookassa` module. Expo Go cannot run the payment SDK.

Create Vault secrets `marketplace_worker_url` (full API `/api/cron/marketplace` URL) and `marketplace_worker_secret`, then apply `supabase/deploy/marketplace-cron.sql`. It schedules one authenticated invocation per minute using Cron and pg_net. Each batch leases at most 10 jobs for two minutes. Jobs remain in Postgres if the API is offline; expired leases are reclaimed. Provider reconciliation retries indefinitely with bounded backoff; notifications become Office-visible failed jobs after ten attempts.

The worker records heartbeat and overdue attention flags. Acceptance targets are Food 10 minutes, Mart 2 hours and Experts 30 minutes after payment. Accepted product fulfillment uses the frozen `sla_text` duration (default one hour); Expert fulfillment is due at the session end. Office flags missing worker completion after five minutes. Unknown payments remain visible for resolution immediately.

Notifications are an **at-least-once outbox**. Event/job deduplication prevents ordinary double scheduling, but SES has no idempotent send: a process crash after email acceptance and before job acknowledgement can produce a duplicate email. Payment, stock and refund effects are guarded independently and do not repeat.

## Database evidence and migration

`schema-baseline.json` records the actual REST-exposed table definitions read from the configured project. **That project was not confirmed to be staging.** No remote migrations or data writes were performed. The test-only baseline reproduces the captured columns, types, defaults and required fields. REST does not expose every constraint, trigger, policy, grant or extension, so this is not a complete schema dump or a production bootstrap migration.

Before staging deployment:

1. Confirm the staging project identity; take a schema-only dump and compare its constraints/triggers/policies with the captured baseline. Back up the database.
2. Apply the additive lifecycle migration. It backfills unambiguous fulfillment and defaults operational ownership; ambiguous vendor modes remain unset.
3. Run `supabase/tests/marketplace-audit.sql`; correct reported catalog entries in Office. Select configured city/district identifiers for delivery; arbitrary address text never determines eligibility. Old saved addresses receive the selected zone's structured identifiers when used.
4. Deploy API, Office, web and mobile with creation disabled. Configure Vault and activate Cron. Verify heartbeat, pending-job recovery, expiry and retry behavior.
5. Enable staff-only checkout through the deployment's access controls, finish acceptance below, and then enable lines individually.

Do not apply the test baseline to a remote database. Preserve the historical tables and migration history.

## Verification

Run `npm run test:marketplace --workspace api`. Database tests use PGlite and the actual lifecycle SQL, without gateway credentials. They cover direct/cart creation, idempotency including different keys against the same quote, frozen carts, reservation release, stock exactly once, proof switching restrictions, cancelled/accepted competition semantics, exact refunds, Expert slot exclusivity/session-end guards, overdue detection, leases and database privileges. Unit/failure-injection tests cover decimal pricing, deadlines, native encryption/binding, provider identity, lost responses, local persistence/transition failure, request replay and post-deadline lookup.

PGlite uses one connection; these tests **do not prove multi-connection Postgres locking behavior**. Staging must run concurrent last-item, last-slot, accept/cancel, payment/expiry and cart-edit/checkout races. Check that deadlock/serialization retries reuse the same idempotency key and that the committed result applies each effect once.

Run TypeScript independently of builds:

```
npx tsc --noEmit -p api/tsconfig.json
npx tsc --noEmit -p web/tsconfig.json
npx tsc --noEmit -p office/tsconfig.json
npx tsc --noEmit -p mobile/tsconfig.json
```

## Release acceptance still requiring external environments

- YooKassa sandbox: inline widget, native SDK/3DS, dismissal, lost response, webhook/poll races, replay after restart, missing provider reference, pending-payment method-switch rejection and late payment after cancellation.
- Real Postgres concurrency tests against the confirmed staging schema.
- Cart, fixed direct, customer-entered amount and Expert purchases with manual and RUB online methods; pickup, zoned delivery, private digital delivery and both Expert meeting modes.
- Customer/Office accounts: ownership, private contents, signed proof uploads, acceptance/rejection, full refunds including fees, restocking and unresolved late transfers.
- Next.js, Expo web and physical iOS/Android builds; English/Russian/French/Spanish; keyboard/focus, screen readers, safe areas, restart and deep links.
- API outage/worker interruption, leases, backlog drainage, failed SES delivery, Office retry, heartbeat alerts and operational handoff.

## Staging ops status

Update (2026-09-25):

- Lifecycle tables present on the configured project; RLS ensure migration available.
- Local worker invoke writes `marketplace_worker_health` successfully.
- Generate Vault+Cron paste SQL: `./scripts/marketplace-print-vault-cron.sh` (requires SQL Editor login).
- Production `https://api.ciuna.com/api/cron/marketplace` still 404 until API deploy includes the route + `MARKETPLACE_WORKER_SECRET`.
- Local staff checkout: `api/.env` may set `MARKETPLACE_CHECKOUT_LINES=food`; keep production empty until Cron + sandbox gates pass.
- Catalog: live products clean; published Expert `meeting_instructions` backfilled; `marketplace_zones` may still be empty.


## Automated verification evidence

`npm run test:marketplace --workspace api` covers PGlite lifecycle SQL (create/idempotency/reservations/accept-cancel/refunds/slots/leases), payment recovery/provider identity, and pricing/deadlines. Parallel last-slot attempts after an exclusive hold both fail. **PGlite is single-connection** — multi-connection Postgres races remain a staging gate after migration apply.

## Rollout (Stage 6)

Keep `MARKETPLACE_CHECKOUT_LINES` empty until release gates pass. Then enable `food` → `food,mart` → `food,mart,experts`. Rollback = empty the flag only; leave worker, webhooks, order access, cancel, proof, and refunds running. Office `/marketplace` surfaces worker heartbeat age and overdue/exception queues.


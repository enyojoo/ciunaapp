# Ciuna × Bitbanker — integration plan

23 September 2026. Implementation-focused: wire Bitbanker APIs behind Ciuna UI and Office config.

OpenAPI: https://api.aws.bitbanker.org/latest/docs/public/openapi

## Product shape

- **Users:** Russia-focused; RUB send is primary payment rail.
- **Account verification:** hosted KYC bridge → **`POST /api/v1/kyc-request`** (unsigned) → customer completes Bitbanker/Sumsub/IIDX → **`GET /api/v2/partner-clients`** + **`sbp_client_permission_changed`** → **`is_verified_for_sbp`** unlocks send. Legacy **`POST /api/v2/partner-clients`** form onboarding is retired.
- **Send payment (RUB):** Ciuna pricing → Bitbanker **prediction + SBP invoice** → Ciuna shows QR/amount → webhooks/poll → USDT on partner dashboard → Office manual TRC20 + recipient payout → **completed**.
- **Send payment (non-RUB):** same verification gate; existing **manual** payment methods (Office `payment_methods`).
- **RUB default method:** Bitbanker SBP (`payment_provider = bitbanker`); manual RUB remains Office-configurable (active/default).
- **Non-send features:** hub, experts, etc. — no Bitbanker gate.
- **Customer UI:** Ciuna only (no Bitbanker pay widget). **Completed** = recipient paid (Office), not SBP paid alone.
- **Invoices:** `auto_withdraw=false`, `crypto_payment=false`; manual USDT withdrawal only.

## Bitbanker API usage (server-only)

| Area | Bitbanker endpoints (representative) | Ciuna wrapper |
|------|--------------------------------------|---------------|
| Verification | `POST /api/v1/kyc-request`, `GET /api/v2/partner-clients` | `POST/GET /api/bitbanker/kyc/session`, `GET /api/bitbanker/eligibility` |
| SBP limits/pricing | `GET /api/v2/prediction-sbp`, `POST /api/v2/exchange-prediction` | Inside `POST /api/send/quotes` |
| Pay-in | Invoice create/read (SBP), signed responses | `POST /api/send/transfers`, payment-status poll |
| Webhooks | Payment/invoice callbacks; `sbp_client_permission_changed` | `POST /api/webhooks/bitbanker/payments`, `POST /api/webhooks/bitbanker/events` |

**Adapter responsibilities:** env config, `X-API-KEY`, per-endpoint signing (`timestamp`, `nonce`, `full_sign`, idempotency where required), signature verification on responses and webhooks, RUB → RUBR, error mapping, sandbox vs prod base URL.

**Env (server, gitignored):** `BITBANKER_ENVIRONMENT`, `BITBANKER_API_BASE_URL`, `BITBANKER_API_KEY`, `BITBANKER_API_SECRET`. Sandbox base: `https://ext-api.dev.bitbanker.ru` (no `/latest`). Production: `https://api.aws.bitbanker.org/latest`. Optional `BITBANKER_DEV_ESTIMATE_FEES=1` only when sandbox API is unreachable.

## Ciuna API surface

| Route | Purpose |
|-------|---------|
| `POST /api/bitbanker/kyc/session` | Start or reuse hosted KYC link (`kyc_url`); store session ~1h |
| `GET /api/bitbanker/kyc/session` | Active session + eligibility refresh |
| `GET /api/bitbanker/eligibility` | More badge, send gate |
| `POST /api/webhooks/bitbanker/payments` | Invoice paid/conversion |
| `POST /api/webhooks/bitbanker/events` | SBP permission changes |
| `POST /api/send/quotes` | Firm RUB quote (Policy A), verified users |
| `POST /api/send/transfers` | Accept quote → `transactions` + Bitbanker invoice |
| `GET /api/send/transfers/:id/payment-status` | Order UI polling |

Gate **`POST /api/transactions`** and send UI on `is_verified_for_sbp`. Expose RUB payment methods to clients (Bitbanker default + optional manual).

**Dev bypass:** Gate is **off by default in development** (unset env). Set `CIUNA_SEND_VERIFICATION_GATE=on` (and client `EXPO_PUBLIC_` / `NEXT_PUBLIC_`) to test the gate locally. Explicit `=off` also skips Ciuna UI/API eligibility. **`POST /api/v2/invoices` still requires** a partner client registered via `POST /api/v2/partner-clients` with **`is_verified_for_sbp`** in sandbox (IDX). Quotes/preview work without verification; invoice creation does not.

## RUB pricing (Policy A)

Customer lines: principal, recipient amount, Ciuna rate, **Ciuna fee**, logistics (if cash), **payment processing** (SBP gross-up), **total** = `sbp_info.amount`.

- Invoice input **B** = principal + Ciuna fee + logistics (not gross).
- Use `volume_take_final` for USDT; do not double-subtract fees.
- Contribution check before firm quote (destination payout, TRC20 reserve). Target `comission2 = 0`. Referrals on principal.

## Persistence

- `bitbanker_client_refs`, verification attempts, eligibility snapshot, webhook inbox.
- `send_quotes`; transactions with `payment_provider = bitbanker`, external invoice id, conversion snapshots.
- Extend `payment_provider` enum (migration) like existing `manual` / `yookassa`.
- Office settlement records for manual payout. Do not log passport fields.

## Customer flows

**Verification (More → Account verification)**  
Hub at `/more/verification` (web) or `/verification` (mobile) with an **SBP identity** entry → native form → `POST /api/bitbanker/verification` → Bitbanker `POST /api/v2/partner-clients` → poll `GET /api/bitbanker/eligibility` + events webhook → unlock send. Legacy identity/address upload flows remain for Office history only.

### Verification field map (Ciuna → Bitbanker)

Canonical validation and payload build: `packages/shared/src/bitbanker/verification-validation.ts` (used by web/mobile forms and `POST /api/bitbanker/verification`).

OpenAPI schema: `PartnerClientsUpsertRequestV2` on `POST /api/v2/partner-clients`. Signing fields (`timestamp`, `nonce`, `full_sign`) are added by `api/lib/bitbanker/client.ts`, not the UI.

| Ciuna form / JSON body | Bitbanker partner-clients field | Notes |
|------------------------|----------------------------------|--------|
| _(server)_ | `client_id` | Stable per user from `bitbanker_client_refs` |
| `email` | `email` | Required; email format |
| `phone` | `phone` | Required; normalized to `+7XXXXXXXXXX` |
| `passportCountry` | `country_of_passport_issue` | RU/RUS → sent as `RU`; else up to 3-letter code |
| `firstName` | `first_name` | Cyrillic for RU passport |
| `lastName` | `last_name` | Cyrillic for RU passport |
| `patronymic` | `patronymic` | **Required** when RU passport |
| `firstNameNative` | `first_name_native` | **Required** when non-RU passport |
| `lastNameNative` | `last_name_native` | **Required** when non-RU passport |
| `birthDate` | `birth_date` | UI: `YYYY-MM-DD` or `DD.MM.YYYY` → API: **`DD.MM.YYYY`** |
| `passportNumber` | `passport` | Series + number, **no spaces** (6–20 chars) |
| `passportIssueDate` | `passport_issue_date` | Same date formatting as birth |
| `registrationCountry` | `registration_country` | Non-RU only; max **3** chars (e.g. `RUS`) |
| `registrationCity` | `registration_city` | Non-RU only; registration in Russia |
| `registrationStreet` | `registration_street` | Non-RU only |
| `registrationHouse` | `registration_house` | Non-RU only |
| `registrationIndex` | `registration_index` | Non-RU only; optional |
| `consent` | _(Ciuna only)_ | Required to submit; not sent in partner body |

**Branches**

- **Russian passport** (`passportCountry` = `RU` / `RUS`): patronymic + Cyrillic names; no registration block.
- **Foreign passport**: native names + registration address in Russia (country, city, street, house).

**API errors**

- Client/server validation failures: `400` with `{ fieldErrors: { "<field>": "<errorCode>" } }` — UI maps codes via `verification.bitbanker.errors.*` (i18n).
- Bitbanker/partner failure after submit: `502` with message text (no passport values in logs or DB).

**UI entry points**

- Web form: `web/components/verification/bitbanker-verification-form.tsx` → `/more/verification/bitbanker`
- Mobile form: `mobile/components/bitbanker-verification-form.tsx` → `/verification/bitbanker`

**Send**  
Preview → eligibility gate → payment method (manual vs SBP default) →  
- **SBP:** quote → accept → order + invoice → Ciuna QR screen → poll status.  
- **Manual:** existing `SendMakePaymentStep` + `POST /api/transactions`.

## Wiring vs repo today

| Today | Change |
|-------|--------|
| Send gated on legacy KYC | Gate on `is_verified_for_sbp`; SBP form on verification hub; legacy KYC pages kept |
| Send without provider eligibility | Require `is_verified_for_sbp` |
| RUB manual only | Add Bitbanker method; SBP default in Office |
| No Bitbanker code | `api/lib/bitbanker/*`, routes above, migrations |

Touchpoints: `web/app/send/page.tsx`, `mobile/app/send.tsx`, `api/app/api/transactions/route.ts`, `office` payment methods + transactions, `supabase/migrations`.

## Build order

1. **Adapter + webhooks** — config, signing, inbox tables, deploy callback URLs to Bitbanker dashboard, smoke GET partner-clients.
2. **Verification** — persistence, verification + eligibility routes, replace More verification UX (web/mobile).
3. **Send gate** — API + UI block until verified.
4. **RUB SBP** — quotes, transfers, invoice, Ciuna pay UI, payment webhook reconciliation, `processing` status.
5. **Office** — SBP payment method seed (default RUB), settlement queue, completed transition, admin auth on status changes.
6. **Sandbox rehearsal** — verify user → RUB SBP send → Office complete; manual send path if enabled.

## Webhook notes

- Verify `full_sign` with API secret; persist then ack (events ~3s timeout).
- Payment webhooks may retry and reorder; permission events do not retry — keep polling.
- Register full HTTPS URLs in dashboard (two fields: payments vs events).

## Out of scope

NGN→RUB, customer wallets, Bitbanker auto-withdraw, hosted Sumsub, direct IDX SDK, legacy manual KYC approval.

## Open (technical / ops)

Sandbox: IDX/SBP activation on partner side, invoice/QR lifecycle, residual RUBR, `comission2`, destination desk rate for contribution check, refund/shortfall ownership. Field validation per passport branch is implemented in shared validation (adjust if sandbox rejects specific payloads).

Sandbox credentials in local `api/.env` only.

**Local smoke (adapter only):** `cd api && npx tsx scripts/bitbanker-smoke.ts` (optional `BITBANKER_SMOKE_CLIENT_ID` for GET partner-client). Register webhooks in the Bitbanker dashboard: `{API_URL}/api/webhooks/bitbanker/payments` and `.../events`.


## Verified sandbox connectivity — 24 September 2026

Read-only `GET /api/v2/prediction-sbp` succeeded on `https://ext-api.dev.bitbanker.ru` with HTTP 200 using the locally saved credentials (`sbp_fee_pct=2.1`, `sbp_fee_abs=210`). Signed `POST /api/v2/exchange-prediction` with `volume=10000` returns gross ~10214.5 RUB (~214.5 RUB processing uplift). Updated local `api/.env` to `BITBANKER_API_BASE_URL=https://ext-api.dev.bitbanker.ru`; do not append `/latest`. Production host `api.aws.bitbanker.org` returned 401 with the same sandbox keys; `api.aws.dev.bitbanker.org` does not resolve here. **Note:** Ciuna’s local `full_sign` verifier still disagrees with sandbox responses; adapter logs a warning and continues in sandbox until canonical rules are aligned (or set `BITBANKER_VERIFY_RESPONSES=1` to fail hard).

The production host `https://api.aws.bitbanker.org/latest` returned HTTP 401 for these credentials. The older documented `api.aws.dev.bitbanker.org` hostname failed DNS resolution from this environment. No verification attempt, client registration, invoice, payment, or withdrawal was created. IDX activation and complete payment capability still require separate testing. Restart the local API process to load the changed environment variable.

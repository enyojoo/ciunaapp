-- Bitbanker: verification, send quotes, webhooks, transaction extensions.
-- Apply via supabase db push or SQL Editor (same as other migrations in this repo).

-- ============================================================================
-- 1. Partner client refs (one stable client_id per user per environment)
-- ============================================================================

create table if not exists bitbanker_client_refs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  environment text not null default 'sandbox',
  client_id text not null,
  is_verified_for_sbp boolean not null default false,
  last_checked_at timestamptz,
  last_reason text,
  provider_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, environment),
  unique (client_id, environment)
);

create index if not exists bitbanker_client_refs_user_id_idx on bitbanker_client_refs (user_id);

alter table bitbanker_client_refs enable row level security;

-- ============================================================================
-- 2. Verification attempts (idempotency; no passport data stored)
-- ============================================================================

create table if not exists bitbanker_verification_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_ref_id uuid not null references bitbanker_client_refs(id) on delete cascade,
  idempotency_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'succeeded', 'failed')),
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists bitbanker_verification_attempts_user_id_idx
  on bitbanker_verification_attempts (user_id);

alter table bitbanker_verification_attempts enable row level security;

-- ============================================================================
-- 3. Webhook inbox
-- ============================================================================

create table if not exists bitbanker_webhook_inbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('payments', 'events')),
  payload_hash text not null,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  unique (channel, payload_hash)
);

create index if not exists bitbanker_webhook_inbox_unprocessed_idx
  on bitbanker_webhook_inbox (created_at)
  where processed_at is null;

alter table bitbanker_webhook_inbox enable row level security;

-- ============================================================================
-- 4. Send quotes (immutable pricing snapshot)
-- ============================================================================

create table if not exists send_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'open'
    check (status in ('open', 'accepted', 'expired', 'superseded')),
  send_amount numeric(14, 2) not null,
  send_currency text not null,
  receive_amount numeric(14, 2) not null,
  receive_currency text not null,
  exchange_rate numeric(18, 8) not null,
  fee_amount numeric(14, 2) not null default 0,
  fee_type text,
  logistics_fee_amount numeric(14, 2) not null default 0,
  payment_processing_fee numeric(14, 2),
  total_amount numeric(14, 2) not null,
  invoice_base_b numeric(14, 2),
  predicted_gross_g numeric(14, 2),
  predicted_usdt_u numeric(18, 8),
  recipient_id uuid references recipients(id) on delete set null,
  fulfillment_type text not null default 'bank_transfer',
  delivery_address_line text,
  delivery_phone text,
  delivery_address_id uuid,
  payment_method_intent text not null default 'bitbanker',
  quote_snapshot jsonb,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists send_quotes_user_id_idx on send_quotes (user_id);
create index if not exists send_quotes_status_expires_idx on send_quotes (status, expires_at);

alter table send_quotes enable row level security;

-- ============================================================================
-- 5. Bitbanker payment attempts (invoice idempotency per quote)
-- ============================================================================

create table if not exists bitbanker_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  send_quote_id uuid not null references send_quotes(id) on delete cascade,
  transaction_id uuid references transactions(id) on delete set null,
  idempotency_key text not null,
  bitbanker_invoice_id text,
  sbp_payable_amount numeric(14, 2),
  sbp_payload jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'invoice_created', 'paid', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists bitbanker_payment_attempts_quote_id_idx
  on bitbanker_payment_attempts (send_quote_id);

alter table bitbanker_payment_attempts enable row level security;

-- ============================================================================
-- 6. transactions — Bitbanker columns + payment_provider bitbanker
-- ============================================================================

alter table transactions drop constraint if exists transactions_payment_provider_check;

alter table transactions
  add column if not exists send_quote_id uuid references send_quotes(id) on delete set null,
  add column if not exists payment_processing_fee numeric(14, 2),
  add column if not exists bitbanker_conversion_snapshot jsonb,
  add column if not exists settlement_metadata jsonb;

alter table transactions
  add constraint transactions_payment_provider_check
  check (payment_provider in ('manual', 'yookassa', 'bitbanker'));

-- Re-use gateway_payment_id for Bitbanker invoice id when payment_provider = bitbanker

-- ============================================================================
-- 7. payment_methods — provider discriminator for API rails
-- ============================================================================

alter table payment_methods
  add column if not exists provider text not null default 'manual';

comment on column payment_methods.provider is 'manual | bitbanker (SBP API) | etc.';

-- Seed Bitbanker SBP method for RUB. Default only if no RUB default exists yet (unique per currency).
insert into payment_methods (currency, type, name, provider, is_default, status, instructions)
select
  'RUB',
  'qr_code',
  'SBP (Bitbanker)',
  'bitbanker',
  not exists (
    select 1 from payment_methods pm where pm.currency = 'RUB' and pm.is_default = true
  ),
  'active',
  'Pay via SBP QR generated at checkout.'
where not exists (
  select 1 from payment_methods where currency = 'RUB' and provider = 'bitbanker'
);

-- ============================================================================
-- 8. Optional send drafts (resume after verification)
-- ============================================================================

create table if not exists send_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  draft jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table send_drafts enable row level security;

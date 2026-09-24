-- Hosted Bitbanker KYC bridge sessions (Sumsub / IIDX).

create table if not exists bitbanker_kyc_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_ref_id uuid not null references bitbanker_client_refs(id) on delete cascade,
  external_client_ref text not null,
  kyc_url text not null,
  payment_url text,
  provider text,
  bridge_status text not null default 'active'
    check (bridge_status in ('active', 'expired', 'completed', 'superseded')),
  expires_at timestamptz not null,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bitbanker_kyc_sessions_user_id_idx on bitbanker_kyc_sessions (user_id);
create index if not exists bitbanker_kyc_sessions_active_idx
  on bitbanker_kyc_sessions (user_id, expires_at desc)
  where bridge_status = 'active';

comment on table bitbanker_kyc_sessions is 'Hosted KYC bridge links from POST /api/v1/kyc-request';

alter table bitbanker_kyc_sessions enable row level security;

-- USDT desk rate and other corridor metadata (Bitbanker leg-2 pricing).
alter table exchange_rates
  add column if not exists metadata jsonb not null default '{}'::jsonb;

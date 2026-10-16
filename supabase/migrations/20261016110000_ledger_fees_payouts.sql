-- Ciuna Seller money: fee rules/plans, double-entry ledger, per-order earnings, payouts.
-- Same access model as the other marketplace tables: RLS on, no policies, service-role only; every mutation
-- goes through the security-definer functions below so balances can never drift from entries.
begin;

-- ---------------------------------------------------------------------------------------------
-- fee engine configuration (edited in Office)
-- ---------------------------------------------------------------------------------------------
create table if not exists fee_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  monthly_fee numeric(14,2) not null default 0 check (monthly_fee >= 0),   -- subscription/listing fee: built, billing off at launch
  currency text not null default 'RUB' check (currency ~ '^[A-Z]{3}$'),
  commission_percent numeric(6,3) check (commission_percent between 0 and 100), -- overrides service-line/platform commission
  perks jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table merchants add column if not exists fee_plan_id uuid references fee_plans(id);

create table if not exists fee_rules (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('commission', 'payout')),
  scope text not null check (scope in ('platform', 'service_line', 'category', 'merchant')),
  service_line text check (service_line in ('food', 'mart', 'experts')),
  category text,
  merchant_id uuid references merchants(id) on delete cascade,
  percent numeric(6,3) check (percent between 0 and 100),
  fixed_amount numeric(14,2) check (fixed_amount >= 0),
  currency text check (currency ~ '^[A-Z]{3}$'),
  min_fee numeric(14,2) check (min_fee >= 0),
  max_fee numeric(14,2) check (max_fee >= 0),
  waive_above numeric(14,2) check (waive_above >= 0),                      -- payout fee waived at or above this amount
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (percent is not null or fixed_amount is not null),
  check (fixed_amount is null or currency is not null),
  check (min_fee is null or max_fee is null or min_fee <= max_fee),
  check (
    (scope = 'platform' and service_line is null and category is null and merchant_id is null) or
    (scope = 'service_line' and service_line is not null and category is null and merchant_id is null) or
    (scope = 'category' and service_line is not null and category is not null and merchant_id is null) or
    (scope = 'merchant' and merchant_id is not null)
  )
);
create index if not exists fee_rules_lookup_idx on fee_rules (kind, scope, active);

-- Placeholder launch commissions per service line. Office edits or replaces these; nothing is hardcoded in code.
insert into fee_rules (kind, scope, service_line, percent, note)
select 'commission', 'service_line', l, p, 'Launch default. Adjust in Office.'
from (values ('food', 8), ('mart', 6), ('experts', 12)) as v(l, p)
where not exists (select 1 from fee_rules where kind = 'commission' and scope = 'service_line' and service_line = v.l);

create table if not exists marketplace_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into marketplace_settings (key, value) values
  ('payout_hold_days', '2'),
  ('min_payout', '{"RUB": 1000, "USD": 15, "EUR": 15, "CNY": 100, "NGN": 20000, "GHS": 200, "KES": 2000, "BRL": 80}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------------------------
-- double-entry ledger (append-only)
-- ---------------------------------------------------------------------------------------------
create table if not exists ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id),
  kind text not null check (kind in ('merchant_pending', 'merchant_available', 'merchant_payout_hold', 'platform_funding', 'platform_fees', 'platform_payouts')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  check ((kind like 'merchant_%') = (merchant_id is not null)),
  unique nulls not distinct (merchant_id, kind, currency)
);

create table if not exists ledger_txns (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                 -- idempotency key
  kind text not null,
  order_id uuid,
  payout_id uuid,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists ledger_entries (
  id bigint generated always as identity primary key,
  txn_id uuid not null references ledger_txns(id),
  account_id uuid not null references ledger_accounts(id),
  amount numeric(18,2) not null check (amount <> 0),   -- merchant accounts: positive = owed to the merchant
  currency text not null,
  created_at timestamptz not null default now()
);
create index if not exists ledger_entries_account_idx on ledger_entries (account_id, id);
create index if not exists ledger_entries_txn_idx on ledger_entries (txn_id);

create or replace function ledger_immutable() returns trigger language plpgsql as $$
begin raise exception 'ledger is append-only'; end $$;
drop trigger if exists ledger_entries_immutable on ledger_entries;
create trigger ledger_entries_immutable before update or delete on ledger_entries for each row execute function ledger_immutable();
drop trigger if exists ledger_txns_immutable on ledger_txns;
create trigger ledger_txns_immutable before update or delete on ledger_txns for each row execute function ledger_immutable();

create or replace view ledger_balances with (security_invoker = true) as
select a.id as account_id, a.merchant_id, a.kind, a.currency, coalesce(sum(e.amount), 0)::numeric(18,2) as balance
from ledger_accounts a left join ledger_entries e on e.account_id = a.id
group by a.id;

-- ---------------------------------------------------------------------------------------------
-- earnings, order fee snapshots, payouts
-- ---------------------------------------------------------------------------------------------
create table if not exists order_fees (
  order_id uuid primary key references marketplace_orders(id),
  merchant_id uuid not null references merchants(id),
  currency text not null,
  subtotal numeric(14,2) not null,
  commission numeric(14,2) not null check (commission >= 0),
  snapshot jsonb not null,                 -- the rule that applied, so later edits never rewrite history
  created_at timestamptz not null default now()
);

create table if not exists merchant_earnings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references marketplace_orders(id),
  merchant_id uuid not null references merchants(id),
  currency text not null,
  subtotal numeric(14,2) not null,
  delivery_fee numeric(14,2) not null default 0,
  commission numeric(14,2) not null,
  net numeric(14,2) not null check (net >= 0),
  status text not null default 'pending' check (status in ('pending', 'available', 'reversed')),
  fulfilled_at timestamptz not null default now(),
  release_at timestamptz not null,
  released_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists merchant_earnings_merchant_idx on merchant_earnings (merchant_id, fulfilled_at desc);
create index if not exists merchant_earnings_release_idx on merchant_earnings (status, release_at);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id),
  method_id uuid not null references merchant_payout_methods(id),
  method_snapshot jsonb not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  amount numeric(14,2) not null check (amount > 0),
  fee numeric(14,2) not null default 0 check (fee >= 0),
  net numeric(14,2) not null check (net >= 0),
  status text not null default 'requested' check (status in ('requested', 'approved', 'paid', 'rejected', 'cancelled')),
  reference text,
  reason text,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  paid_at timestamptz
);
create index if not exists payouts_queue_idx on payouts (status, requested_at);
create index if not exists payouts_merchant_idx on payouts (merchant_id, requested_at desc);

-- ---------------------------------------------------------------------------------------------
-- functions
-- ---------------------------------------------------------------------------------------------
-- p_lines: [{"merchant_id": uuid|null, "kind": "...", "currency": "RUB", "amount": 12.34}, ...]; must sum to zero per currency.
create or replace function ledger_post(p_key text, p_kind text, p_lines jsonb, p_order uuid default null, p_payout uuid default null, p_memo text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare tid uuid; ln jsonb; acc uuid; bad numeric;
begin
  select id into tid from ledger_txns where key = p_key;
  if found then return tid; end if;
  select coalesce(max(abs(s)), 0) into bad from (
    select sum((l->>'amount')::numeric) as s from jsonb_array_elements(p_lines) l group by l->>'currency'
  ) t;
  if bad <> 0 then raise exception 'LEDGER_UNBALANCED'; end if;
  insert into ledger_txns (key, kind, order_id, payout_id, memo) values (p_key, p_kind, p_order, p_payout, p_memo) returning id into tid;
  for ln in select * from jsonb_array_elements(p_lines) loop
    if (ln->>'amount')::numeric = 0 then continue; end if;
    insert into ledger_accounts (merchant_id, kind, currency)
      values (nullif(ln->>'merchant_id', '')::uuid, ln->>'kind', ln->>'currency')
      on conflict (merchant_id, kind, currency) do nothing;
    select id into acc from ledger_accounts
      where merchant_id is not distinct from nullif(ln->>'merchant_id', '')::uuid and kind = ln->>'kind' and currency = ln->>'currency';
    insert into ledger_entries (txn_id, account_id, amount, currency) values (tid, acc, (ln->>'amount')::numeric, ln->>'currency');
  end loop;
  return tid;
end $$;

create or replace function ledger_balance(p_merchant uuid, p_kind text, p_currency text) returns numeric
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(sum(e.amount), 0) from ledger_entries e join ledger_accounts a on a.id = e.account_id
  where a.merchant_id = p_merchant and a.kind = p_kind and a.currency = p_currency
$$;

-- Records a fulfilled order's earnings once. Commission is computed by the API (fee rules) and passed in.
create or replace function earning_record(p_order uuid, p_commission numeric, p_snapshot jsonb, p_hold_days integer)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare o marketplace_orders; eid uuid; sub numeric; del numeric; cur text; net numeric;
begin
  select * into o from marketplace_orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.merchant_id is null then return null; end if;
  if o.fulfillment_state <> 'fulfilled' then raise exception 'ORDER_NOT_FULFILLED'; end if;
  select id into eid from merchant_earnings where order_id = p_order;
  if found then return eid; end if;
  sub := coalesce((o.snapshot #>> '{totals,subtotal}')::numeric, 0);
  del := coalesce((o.snapshot #>> '{totals,deliveryFee}')::numeric, 0);
  cur := coalesce(o.snapshot #>> '{totals,productCurrency}', o.snapshot #>> '{totals,payCurrency}');
  if cur is null then raise exception 'ORDER_CURRENCY_MISSING'; end if;
  if p_commission < 0 or p_commission > sub then raise exception 'COMMISSION_INVALID'; end if;
  net := sub + del - p_commission;
  insert into merchant_earnings (order_id, merchant_id, currency, subtotal, delivery_fee, commission, net, release_at)
    values (p_order, o.merchant_id, cur, sub, del, p_commission, net, now() + make_interval(days => greatest(p_hold_days, 0)))
    returning id into eid;
  insert into order_fees (order_id, merchant_id, currency, subtotal, commission, snapshot)
    values (p_order, o.merchant_id, cur, sub, p_commission, coalesce(p_snapshot, '{}')) on conflict (order_id) do nothing;
  perform ledger_post('earning:' || p_order::text, 'earning',
    jsonb_build_array(
      jsonb_build_object('merchant_id', null, 'kind', 'platform_funding', 'currency', cur, 'amount', -(sub + del)),
      jsonb_build_object('merchant_id', o.merchant_id, 'kind', 'merchant_pending', 'currency', cur, 'amount', net),
      jsonb_build_object('merchant_id', null, 'kind', 'platform_fees', 'currency', cur, 'amount', p_commission)),
    p_order, null, 'Order fulfilled');
  return eid;
end $$;

-- Moves earnings past their hold from pending to available. Safe to call repeatedly.
create or replace function earnings_release_due() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare e merchant_earnings; n integer := 0;
begin
  for e in select * from merchant_earnings where status = 'pending' and release_at <= now() order by release_at for update skip locked loop
    perform ledger_post('release:' || e.id::text, 'release',
      jsonb_build_array(
        jsonb_build_object('merchant_id', e.merchant_id, 'kind', 'merchant_pending', 'currency', e.currency, 'amount', -e.net),
        jsonb_build_object('merchant_id', e.merchant_id, 'kind', 'merchant_available', 'currency', e.currency, 'amount', e.net)),
      e.order_id, null, 'Hold ended');
    update merchant_earnings set status = 'available', released_at = now() where id = e.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Clawback after a post-fulfilment refund. May drive the merchant balance negative; Office decides how to recover.
create or replace function earning_reverse(p_order uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare e merchant_earnings; acct text;
begin
  select * into e from merchant_earnings where order_id = p_order for update;
  if not found or e.status = 'reversed' then return; end if;
  acct := case e.status when 'pending' then 'merchant_pending' else 'merchant_available' end;
  perform ledger_post('reverse:' || e.id::text, 'reversal',
    jsonb_build_array(
      jsonb_build_object('merchant_id', e.merchant_id, 'kind', acct, 'currency', e.currency, 'amount', -e.net),
      jsonb_build_object('merchant_id', null, 'kind', 'platform_fees', 'currency', e.currency, 'amount', -e.commission),
      jsonb_build_object('merchant_id', null, 'kind', 'platform_funding', 'currency', e.currency, 'amount', e.subtotal + e.delivery_fee)),
    p_order, null, coalesce(p_reason, 'Refund after fulfilment'));
  update merchant_earnings set status = 'reversed' where id = e.id;
end $$;

create or replace function payout_request(p_merchant uuid, p_method uuid, p_amount numeric, p_currency text, p_user uuid, p_min numeric, p_fee numeric)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare m merchant_payout_methods; pid uuid; avail numeric; open_n integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('payout:' || p_merchant::text, 0));
  select * into m from merchant_payout_methods where id = p_method and merchant_id = p_merchant;
  if not found then raise exception 'PAYOUT_METHOD_NOT_FOUND'; end if;
  if not m.verified then raise exception 'PAYOUT_METHOD_NOT_VERIFIED'; end if;
  if m.currency <> p_currency then raise exception 'PAYOUT_CURRENCY_MISMATCH'; end if;
  if p_amount <= 0 then raise exception 'AMOUNT_INVALID'; end if;
  if p_amount < p_min then raise exception 'BELOW_MINIMUM_PAYOUT'; end if;
  if p_fee < 0 or p_fee >= p_amount then raise exception 'PAYOUT_FEE_INVALID'; end if;
  select count(*) into open_n from payouts where merchant_id = p_merchant and status in ('requested', 'approved');
  if open_n >= 3 then raise exception 'TOO_MANY_OPEN_PAYOUTS'; end if;
  avail := ledger_balance(p_merchant, 'merchant_available', p_currency);
  if avail < p_amount then raise exception 'INSUFFICIENT_BALANCE'; end if;
  insert into payouts (merchant_id, method_id, method_snapshot, currency, amount, fee, net, requested_by)
    values (p_merchant, p_method, jsonb_build_object('kind', m.kind, 'label', m.label, 'last4', m.last4), p_currency, p_amount, p_fee, p_amount - p_fee, p_user)
    returning id into pid;
  perform ledger_post('payout-req:' || pid::text, 'payout_request',
    jsonb_build_array(
      jsonb_build_object('merchant_id', p_merchant, 'kind', 'merchant_available', 'currency', p_currency, 'amount', -p_amount),
      jsonb_build_object('merchant_id', p_merchant, 'kind', 'merchant_payout_hold', 'currency', p_currency, 'amount', p_amount)),
    null, pid, 'Payout requested');
  return pid;
end $$;

create or replace function payout_decide(p_payout uuid, p_action text, p_actor uuid, p_reference text default null, p_reason text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare p payouts;
begin
  select * into p from payouts where id = p_payout for update;
  if not found then raise exception 'PAYOUT_NOT_FOUND'; end if;
  if p_action = 'approve' then
    if p.status <> 'requested' then raise exception 'INVALID_TRANSITION'; end if;
    update payouts set status = 'approved', decided_by = p_actor, decided_at = now() where id = p.id;
  elsif p_action = 'paid' then
    if p.status not in ('requested', 'approved') then raise exception 'INVALID_TRANSITION'; end if;
    if length(trim(coalesce(p_reference, ''))) = 0 then raise exception 'REFERENCE_REQUIRED'; end if;
    perform ledger_post('payout-paid:' || p.id::text, 'payout_paid',
      jsonb_build_array(
        jsonb_build_object('merchant_id', p.merchant_id, 'kind', 'merchant_payout_hold', 'currency', p.currency, 'amount', -p.amount),
        jsonb_build_object('merchant_id', null, 'kind', 'platform_payouts', 'currency', p.currency, 'amount', p.amount - p.fee),
        jsonb_build_object('merchant_id', null, 'kind', 'platform_fees', 'currency', p.currency, 'amount', p.fee)),
      null, p.id, 'Payout paid');
    update payouts set status = 'paid', reference = trim(p_reference), decided_by = coalesce(decided_by, p_actor), decided_at = coalesce(decided_at, now()), paid_at = now() where id = p.id;
  elsif p_action in ('reject', 'cancel') then
    if p.status not in ('requested', 'approved') or (p_action = 'cancel' and p.status <> 'requested') then raise exception 'INVALID_TRANSITION'; end if;
    if p_action = 'reject' and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'REASON_REQUIRED'; end if;
    perform ledger_post('payout-back:' || p.id::text, 'payout_returned',
      jsonb_build_array(
        jsonb_build_object('merchant_id', p.merchant_id, 'kind', 'merchant_payout_hold', 'currency', p.currency, 'amount', -p.amount),
        jsonb_build_object('merchant_id', p.merchant_id, 'kind', 'merchant_available', 'currency', p.currency, 'amount', p.amount)),
      null, p.id, 'Payout ' || p_action);
    update payouts set status = case p_action when 'reject' then 'rejected' else 'cancelled' end, reason = p_reason, decided_by = p_actor, decided_at = now() where id = p.id;
  else
    raise exception 'INVALID_ACTION';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- access: service role only
-- ---------------------------------------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['fee_plans','fee_rules','marketplace_settings','ledger_accounts','ledger_txns','ledger_entries','order_fees','merchant_earnings','payouts'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from public, anon, authenticated', t);
    execute format('grant all on table %I to service_role', t);
  end loop;
  revoke all on ledger_balances from public, anon, authenticated;
  grant select on ledger_balances to service_role;
end $$;
grant usage, select on sequence ledger_entries_id_seq to service_role;
revoke execute on function ledger_post(text, text, jsonb, uuid, uuid, text), ledger_balance(uuid, text, text), earning_record(uuid, numeric, jsonb, integer),
  earnings_release_due(), earning_reverse(uuid, text), payout_request(uuid, uuid, numeric, text, uuid, numeric, numeric), payout_decide(uuid, text, uuid, text, text)
  from public, anon, authenticated;
grant execute on function ledger_post(text, text, jsonb, uuid, uuid, text), ledger_balance(uuid, text, text), earning_record(uuid, numeric, jsonb, integer),
  earnings_release_due(), earning_reverse(uuid, text), payout_request(uuid, uuid, numeric, text, uuid, numeric, numeric), payout_decide(uuid, text, uuid, text, text)
  to service_role;

commit;

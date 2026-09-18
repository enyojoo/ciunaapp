-- Hub cart (Food/Mart) + gateway payments (YooKassa) support.
--
-- This migration is additive only: it adds new tables and nullable/defaulted
-- columns. Nothing here changes existing rows or existing read paths.
--
-- This file is NOT applied automatically. Apply it yourself with:
--   supabase db push
-- or by pasting this file into the Supabase Dashboard -> SQL Editor and running it.

-- ============================================================================
-- 1. hub_carts / hub_cart_items — server-synced, single-vendor cart.
-- ============================================================================

create table if not exists hub_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  service_line_slug text not null check (service_line_slug in ('food', 'mart')),
  vendor_id uuid not null references hub_vendors(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active cart per user per vendor. Converted/abandoned carts are kept for history
-- and do not block a fresh active cart from being created for the same vendor.
create unique index if not exists hub_carts_active_user_vendor_idx
  on hub_carts (user_id, vendor_id)
  where status = 'active';

create index if not exists hub_carts_user_id_idx on hub_carts (user_id);

create table if not exists hub_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references hub_carts(id) on delete cascade,
  hub_product_id uuid not null references hub_products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, hub_product_id)
);

create index if not exists hub_cart_items_cart_id_idx on hub_cart_items (cart_id);

-- All access to these tables goes through the api.ciuna.com service-role API routes
-- (never queried directly from the browser/app), same as hub_products/transactions.
-- RLS is enabled with no permissive policies so a leaked anon key cannot read/write carts.
alter table hub_carts enable row level security;
alter table hub_cart_items enable row level security;

-- ============================================================================
-- 2. hub_order_items — frozen line items for a completed checkout.
--    A `transactions` row is the order header; its items live here. Populated
--    for every new Hub order going forward (including single-item ones), so
--    downstream code (order detail, Transactions list, Office) has one shape
--    to read instead of branching on hub_product_id being set directly.
-- ============================================================================

create table if not exists hub_order_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  hub_product_id uuid references hub_products(id) on delete set null,
  title text not null,
  unit_price numeric(14, 2) not null,
  currency text not null,
  quantity integer not null default 1 check (quantity > 0),
  line_total numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists hub_order_items_transaction_id_idx on hub_order_items (transaction_id);

alter table hub_order_items enable row level security;

-- ============================================================================
-- 3. transactions — gateway payment columns (YooKassa today, any future
--    provider later). Nullable/defaulted so every existing row is unaffected.
-- ============================================================================

alter table transactions
  add column if not exists payment_provider text not null default 'manual'
    check (payment_provider in ('manual', 'yookassa')),
  add column if not exists gateway_payment_id text,
  add column if not exists gateway_status text,
  add column if not exists gateway_confirmation_url text;

create unique index if not exists transactions_gateway_payment_id_idx
  on transactions (gateway_payment_id)
  where gateway_payment_id is not null;

-- ============================================================================
-- 4. hub_products — optional inventory fields. Null/false means "unlimited
--    stock", so no existing product needs to be touched for this to be safe.
-- ============================================================================

alter table hub_products
  add column if not exists stock_quantity integer,
  add column if not exists sold_out boolean not null default false;

-- Test-only baseline generated from the configured REST schema on 2026-09-24.
-- It captures columns/types/defaults/nullability for PGlite marketplace tests.
-- DO NOT run this on a remote Supabase project (staging/production). Use
-- supabase/migrations/20260925090000_marketplace_lifecycle.sql instead.
do $$ begin
  create role anon;
exception when duplicate_object then null;
end $$;
do $$ begin
  create role authenticated;
exception when duplicate_object then null;
end $$;
do $$ begin
  create role service_role;
exception when duplicate_object then null;
end $$;
create table "users" (
 "id" uuid primary key default gen_random_uuid() not null,
 "email" text not null,
 "first_name" text not null,
 "last_name" text not null,
 "phone" text,
 "base_currency" text default 'NGN',
 "status" text default 'active',
 "created_at" timestamp with time zone default now(),
 "updated_at" timestamp with time zone default now(),
 "pin_hash" text,
 "kyc_status" text,
 "kyc_rejection_reasons" jsonb,
 "kyc_signed_agreement_id" text,
 "bridge_usd_virtual_account_id" text,
 "bridge_eur_virtual_account_id" text,
 "kyc_endorsements" jsonb,
 "country_code" text,
 "residential_address" jsonb,
 "kyc_external_customer_id" text,
 "middle_name" text,
 "date_of_birth" date,
 "address" text,
 "kyc_metadata" jsonb,
 "referral_slug" text,
 "referred_by_user_id" uuid,
 "referral_percent_window_ends_at" timestamp with time zone,
 "referral_first_qualifying_completed_at" timestamp with time zone,
 "preferred_language" text,
 "avatar_url" text
);
create table "transactions" (
 "id" uuid primary key default gen_random_uuid() not null,
 "transaction_id" text not null,
 "user_id" uuid not null,
 "recipient_id" uuid,
 "send_amount" numeric not null,
 "send_currency" text not null,
 "receive_amount" numeric not null,
 "receive_currency" text not null,
 "exchange_rate" numeric not null,
 "fee_amount" numeric default 0,
 "fee_type" text default 'free',
 "total_amount" numeric not null,
 "status" text default 'pending',
 "receipt_url" text,
 "receipt_filename" text,
 "created_at" timestamp with time zone default now(),
 "updated_at" timestamp with time zone default now(),
 "reference" text,
 "completed_at" timestamp with time zone,
 "fulfillment_type" text default 'bank_transfer' not null,
 "logistics_fee_amount" numeric default 0 not null,
 "logistics_fee_type_snapshot" text,
 "delivery_address_line" text,
 "delivery_phone" text,
 "delivery_address_id" uuid,
 "transaction_source" text default 'send' not null,
 "hub_product_id" uuid,
 "hub_snapshot" jsonb,
 "hub_fee_amount" numeric default 0 not null,
 "payment_provider" text default 'manual' not null,
 "gateway_payment_id" text,
 "gateway_status" text,
 "gateway_confirmation_url" text,
 "send_quote_id" uuid,
 "payment_processing_fee" numeric,
 "bitbanker_conversion_snapshot" jsonb,
 "settlement_metadata" jsonb
);
create table "hub_products" (
 "id" uuid primary key default gen_random_uuid() not null,
 "title" text not null,
 "short_description" text,
 "category" text not null,
 "status" text default 'draft' not null,
 "pricing_type" text not null,
 "fixed_amount" numeric,
 "fixed_currency" text,
 "default_input_currency" text default 'USD',
 "fee_percent" numeric,
 "funded_min" numeric,
 "funded_max" numeric,
 "sla_text" text,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null,
 "image_url" text,
 "is_featured" boolean default false not null,
 "fulfillment_type" text default 'online' not null,
 "vendor_id" uuid,
 "list_price" numeric,
 "sale_price" numeric,
 "service_line_slug" text,
 "stock_quantity" integer,
 "sold_out" boolean default false not null
);
create table "hub_vendors" (
 "id" uuid primary key default gen_random_uuid() not null,
 "service_line_slug" text not null,
 "name" text not null,
 "slug" text not null,
 "photo_url" text,
 "short_bio" text,
 "is_published" boolean default false not null,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null,
 "is_verified" boolean default false not null,
 "location" text
);
create table "hub_carts" (
 "id" uuid primary key default gen_random_uuid() not null,
 "user_id" uuid not null,
 "service_line_slug" text not null,
 "vendor_id" uuid not null,
 "status" text default 'active' not null,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null
);
create table "hub_cart_items" (
 "id" uuid primary key default gen_random_uuid() not null,
 "cart_id" uuid not null,
 "hub_product_id" uuid not null,
 "quantity" integer default 1 not null,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null
);
create table "hub_order_items" (
 "id" uuid primary key default gen_random_uuid() not null,
 "transaction_id" uuid not null,
 "hub_product_id" uuid,
 "title" text not null,
 "unit_price" numeric not null,
 "currency" text not null,
 "quantity" integer default 1 not null,
 "line_total" numeric not null,
 "created_at" timestamp with time zone default now() not null
);
create table "expert_profiles" (
 "id" uuid primary key default gen_random_uuid() not null,
 "display_name" text not null,
 "headline" text,
 "bio" text,
 "is_published" boolean default false not null,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null,
 "category" text default 'Other' not null,
 "image_url" text,
 "capabilities" jsonb not null,
 "fulfillment_type" text default 'online' not null,
 "service_area" text,
 "meeting_hint" text,
 "slug" text
);
create table "expert_services" (
 "id" uuid primary key default gen_random_uuid() not null,
 "expert_profile_id" uuid not null,
 "title" text not null,
 "short_description" text,
 "sort_order" integer default 0 not null,
 "is_published" boolean default false not null,
 "pricing_type" text default 'quote' not null,
 "hourly_rate" numeric,
 "hourly_currency" text,
 "fixed_amount" numeric,
 "fixed_currency" text,
 "package_label" text,
 "default_duration_minutes" integer,
 "min_session_minutes" integer,
 "max_session_minutes" integer,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null,
 "fulfillment_type" text default 'online' not null
);
create table "expert_service_slots" (
 "id" uuid primary key default gen_random_uuid() not null,
 "expert_service_id" uuid not null,
 "slot_start" timestamp with time zone not null,
 "slot_end" timestamp with time zone not null,
 "status" text default 'available' not null,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null,
 "source" text default 'manual' not null,
 "schedule_id" uuid
);
create table "expert_bookings" (
 "id" uuid primary key default gen_random_uuid() not null,
 "user_id" uuid not null,
 "expert_profile_id" uuid not null,
 "status" text default 'pending' not null,
 "slot_start" timestamp with time zone,
 "slot_end" timestamp with time zone,
 "message" text,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null,
 "expert_service_id" uuid,
 "expert_service_slot_id" uuid,
 "pricing_type_snapshot" text,
 "transaction_id" text
);
create table "payment_methods" (
 "id" uuid primary key default gen_random_uuid() not null,
 "currency" text not null,
 "type" text not null,
 "name" text not null,
 "account_name" text,
 "account_number" text,
 "bank_name" text,
 "qr_code_data" text,
 "instructions" text,
 "status" text default 'active',
 "is_default" boolean default false,
 "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
 "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
 "routing_number" text,
 "sort_code" text,
 "iban" text,
 "swift_bic" text,
 "completion_timer_seconds" integer default 3600,
 "crypto_asset" text,
 "crypto_network" text,
 "wallet_address" text,
 "provider" text default 'manual' not null
);
create table "delivery_addresses" (
 "id" uuid primary key default gen_random_uuid() not null,
 "user_id" uuid not null,
 "address_line" text not null,
 "phone" text not null,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null
);
alter table hub_cart_items add unique(cart_id,hub_product_id);

create table exchange_rates(id uuid primary key default gen_random_uuid(), status text, from_currency text, to_currency text, rate numeric, fee_type text, fee_amount numeric, updated_at timestamptz default now());

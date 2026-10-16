-- Minimal stand-in for what a Supabase project provides before any of our SQL runs.
-- TEST ONLY (PGlite or a scratch Postgres). Never run this on a real Supabase project.
do $$ declare r text; begin
  foreach r in array array['anon','authenticated','service_role','authenticator','supabase_admin','supabase_auth_admin','supabase_storage_admin','dashboard_user','pgbouncer'] loop
    if not exists (select 1 from pg_roles where rolname = r) then execute format('create role %I', r); end if;
  end loop;
end $$;

create schema if not exists extensions;
create schema if not exists auth;
create schema if not exists storage;

-- Supabase installs uuid-ossp in "extensions"; the live defaults call extensions.uuid_generate_v4().
create or replace function extensions.uuid_generate_v4() returns uuid language sql as 'select gen_random_uuid()';

create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;

create table if not exists storage.buckets (id text primary key, name text not null, public boolean default false);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid
);
alter table storage.objects enable row level security;

-- Supabase default privileges: new public objects are visible to the API roles.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

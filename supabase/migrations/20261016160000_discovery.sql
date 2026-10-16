-- Customer discovery: favourites and search indexes. Search itself is a plain ILIKE over trigram indexes for now;
-- the API hides the implementation so a dedicated engine can replace it later.
begin;

do $$ begin
  create extension if not exists pg_trgm;
exception when others then
  raise notice 'pg_trgm unavailable; search falls back to sequential ILIKE';
end $$;

create table if not exists favorites (
  user_id uuid not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('vendor', 'expert', 'product')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index if not exists favorites_target_idx on favorites (target_type, target_id);
alter table favorites enable row level security;
revoke all on table favorites from public, anon, authenticated;
grant all on table favorites to service_role;

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    create index if not exists hub_products_title_trgm on hub_products using gin (lower(title) gin_trgm_ops);
    create index if not exists hub_vendors_name_trgm on hub_vendors using gin (lower(name) gin_trgm_ops);
    create index if not exists expert_profiles_name_trgm on expert_profiles using gin (lower(display_name) gin_trgm_ops);
  end if;
end $$;

commit;

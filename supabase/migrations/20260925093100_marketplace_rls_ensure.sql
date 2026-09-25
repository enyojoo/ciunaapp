-- Idempotent: safe to run after 20260925090000_marketplace_lifecycle.sql (or alone if those tables exist).
-- Ensures every marketplace lifecycle table has RLS enabled and client roles cannot touch them.
begin;
do $$
declare
  t text;
  missing text[];
begin
  foreach t in array array[
    'marketplace_zones',
    'marketplace_quotes',
    'marketplace_orders',
    'marketplace_attempts',
    'marketplace_reservations',
    'marketplace_events',
    'marketplace_refunds',
    'marketplace_jobs',
    'marketplace_worker_health'
  ]
  loop
    if to_regclass(format('public.%I', t)) is null then
      raise exception 'Missing table %. Apply 20260925090000_marketplace_lifecycle.sql first.', t;
    end if;
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from public, anon, authenticated', t);
    execute format('grant all on table %I to service_role', t);
  end loop;

  select coalesce(array_agg(c.relname order by c.relname), '{}')
  into missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname = any(array[
      'marketplace_zones','marketplace_quotes','marketplace_orders','marketplace_attempts',
      'marketplace_reservations','marketplace_events','marketplace_refunds','marketplace_jobs',
      'marketplace_worker_health'
    ])
    and not c.relrowsecurity;

  if cardinality(missing) > 0 then
    raise exception 'RLS still disabled on: %', array_to_string(missing, ', ');
  end if;
end $$;
commit;

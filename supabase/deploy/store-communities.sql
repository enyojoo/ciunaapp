-- Store communities (the communities a store serves, used to filter Food and Mart). Paste into the Supabase SQL Editor. Safe to re-run.
-- Same content as supabase/migrations/20261020100000_store_communities.sql. Ids are listed in packages/shared/src/hub/communities.ts.
begin;
set local lock_timeout = '5s';

alter table merchants
  add column if not exists communities text[] not null default '{}';
alter table hub_vendors
  add column if not exists communities text[] not null default '{}';

do $$
declare
  t text;
begin
  foreach t in array array['merchants', 'hub_vendors'] loop
    if not exists (select 1 from pg_constraint where conname = t || '_communities_check') then
      execute format(
        'alter table %I add constraint %I check (communities <@ array[''nigerian'',''african'',''chinese'',''indian'',''arab'',''latin_american'',''turkish'',''vietnamese'',''korean'',''central_asian'']::text[] and cardinality(communities) <= 5)',
        t, t || '_communities_check');
    end if;
  end loop;
end $$;

-- Existing stores: copy any communities already on the merchant to its storefront row (none at first).
update hub_vendors v
   set communities = m.communities
  from merchants m
 where v.merchant_id = m.id and m.communities <> '{}' and v.communities is distinct from m.communities;

commit;

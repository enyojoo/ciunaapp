-- Store communities: the communities a store serves ("food from home"), set by the seller and used to filter Food and
-- Mart in the customer app. Ids are listed in packages/shared/src/hub/communities.ts. Safe to re-run.
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

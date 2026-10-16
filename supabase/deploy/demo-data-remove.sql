-- Removes everything demo-data.sql added. Does not touch real data. Safe to re-run.
-- It refuses to run (and changes nothing) if a real order, order line or booking references a demo product or demo expert service.
begin;
set local lock_timeout = '5s';

do $$
declare
  n integer;
begin
  select count(*) into n from hub_order_items i where i.hub_product_id in (select id from hub_products where owner_team = 'demo');
  if n > 0 then
    raise exception 'Cannot remove demo data: % order line(s) reference demo products', n;
  end if;

  select count(*) into n from marketplace_orders o
  where exists (select 1 from hub_products p where p.owner_team = 'demo' and o.snapshot::text like '%' || p.id::text || '%');
  if n > 0 then
    raise exception 'Cannot remove demo data: % marketplace order(s) reference demo products', n;
  end if;

  select count(*) into n from expert_bookings b
  where b.expert_service_id in (select x.id from expert_services x join expert_profiles e on e.id = x.expert_profile_id where e.slug like 'demo-%')
     or b.expert_profile_id in (select id from expert_profiles where slug like 'demo-%');
  if n > 0 then
    raise exception 'Cannot remove demo data: % booking(s) reference demo experts', n;
  end if;
end $$;

-- Carts holding demo products are disposable
delete from hub_cart_items where hub_product_id in (select id from hub_products where owner_team = 'demo');

-- Slots, schedules, services, experts, merchants
delete from expert_service_slots where expert_service_id in (select x.id from expert_services x join expert_profiles e on e.id = x.expert_profile_id where e.slug like 'demo-%');
delete from expert_service_schedules where expert_service_id in (select x.id from expert_services x join expert_profiles e on e.id = x.expert_profile_id where e.slug like 'demo-%');
delete from expert_services where expert_profile_id in (select id from expert_profiles where slug like 'demo-%');
delete from expert_profiles where slug like 'demo-%';

-- Demo products on any vendor, demo zones and details on the real Food stores
delete from hub_products where owner_team = 'demo';
delete from marketplace_zones where vendor_id in (select id from hub_vendors where slug like 'demo-%');
delete from marketplace_zones z using (values ('Tverskoy', 150), ('Arbat', 150), ('Khamovniki', 200), ('Yasenevo', 300)) as d(district, fee)
where z.vendor_id in (select id from hub_vendors where slug in ('lacabana', 'harvest-lane')) and z.city = 'Moscow' and z.district = d.district and z.fee = d.fee;
update hub_vendors set pickup_location = null, pickup_hours = null where slug = 'lacabana' and pickup_location = 'Tverskaya St 12, Moscow' and pickup_hours = 'Mon to Sat 10:00 to 21:00';
update hub_vendors set pickup_location = null, pickup_hours = null where slug = 'harvest-lane' and pickup_location = 'Pyatnitskaya St 25, Moscow' and pickup_hours = 'Daily 09:00 to 20:00';
delete from hub_vendors where slug like 'demo-%';
delete from merchants where slug like 'demo-%';

commit;

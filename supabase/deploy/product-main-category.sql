-- Product main category (Food meal types and Mart aisles the apps browse by). Paste into the Supabase SQL Editor. Safe to re-run.
-- Same content as supabase/migrations/20261019190000_product_main_category.sql.
-- Product main category: the fixed meal types (Food) and aisles (Mart) the customer apps browse by.
-- `category` stays as the store's own menu section ("Breakfast", "Grill"); `main_category` decides where the product
-- appears. Ids per line are in packages/shared/src/hub/product-main-categories.ts. Backfilled with the same keywords
-- as mobile/lib/hub-category.ts: Food matches the title first (dishes are named by what they are), Mart matches the
-- category first (a store's aisle names are more reliable than product titles).
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

alter table hub_products
  add column if not exists main_category text
    check (main_category is null or main_category in (
      'mains', 'soups', 'grill', 'snacks', 'breakfast', 'drinks',
      'staples', 'sauces', 'fresh', 'digital', 'other'
    ));

create or replace function pg_temp.ciuna_food_category(t text) returns text language sql immutable as $$
  select case
    when t is null or btrim(t) = '' then null
    when lower(t) ~ '(soup|stew|borscht|egusi|okra|ogbono|суп|борщ|солянк|\mщи\M|sopa|soupe|汤)' then 'soups'
    when lower(t) ~ '(grill|suya|kebab|shawarma|bbq|barbecue|skewer|шашлык|гриль|шаурм|asado|parrilla|烧烤|串)' then 'grill'
    when lower(t) ~ '(snack|pastr|puff|chin chin|meat pie|samosa|пирож|выпечк|закуск|empanada|点心|小吃)' then 'snacks'
    when lower(t) ~ '(breakfast|syrnik|porridge|pancake|omelet|завтрак|сырник|каша|desayuno|petit-d|café da manhã|早餐)' then 'breakfast'
    when lower(t) ~ '(drink|juice|zobo|\mtea\M|coffee|smoothie|kvass|напит|\mсок|\mчай|кофе|квас|bebida|boisson|饮)' then 'drinks'
    when lower(t) ~ '(main|meal|rice|jollof|dish|основн|блюд|обед|plato|plat|prato|主食|套餐)' then 'mains'
    else null
  end
$$;

create or replace function pg_temp.ciuna_mart_category(t text) returns text language sql immutable as $$
  select case
    when t is null or btrim(t) = '' then null
    when lower(t) ~ '(digital|vpn|netflix|chatgpt|gamma|subscription|virtual card|card payment|esim|ai tool|entertainment|connectivity|подписк|виртуальн|цифров|suscrip|abonnement|assinatura|订阅|会员)' then 'digital'
    when lower(t) ~ '(sauce|spice|chili|chilli|seasoning|curry|соус|специ|припра|salsa|épice|tempero|酱|调料)' then 'sauces'
    when lower(t) ~ '(sweet|snack|chocolate|candy|biscuit|cookie|dulce|chips|сладост|шоколад|печень|конфет|bonbon|doce|零食|糖)' then 'snacks'
    when lower(t) ~ '(drink|juice|\mtea\M|coffee|matcha|soda|напит|\mсок|\mчай|кофе|bebida|boisson|饮|茶)' then 'drinks'
    when lower(t) ~ '(fresh|frozen|meat|fish|chicken|beef|vegetable|fruit|свеж|заморож|мяс|рыб|fresco|congel|surgel|新鲜|冷冻|肉|鱼)' then 'fresh'
    when lower(t) ~ '(staple|rice|bean|flour|grain|noodle|pasta|garri|semolina|\myam|corn|\moat|\mрис|фасол|\mмук|крупа|лапш|макарон|harina|frijol|arroz|farine|\mriz\M|farinha|feijão|米|面|豆)' then 'staples'
    else null
  end
$$;

update hub_products
set main_category = case
  when coalesce(service_line_slug, lower(category)) = 'food'
    then coalesce(pg_temp.ciuna_food_category(title), pg_temp.ciuna_food_category(category), 'mains')
  when coalesce(service_line_slug, lower(category)) = 'mart'
    then coalesce(pg_temp.ciuna_mart_category(category), pg_temp.ciuna_mart_category(title), 'other')
end
where main_category is null
  and coalesce(service_line_slug, lower(category)) in ('food', 'mart');

commit;

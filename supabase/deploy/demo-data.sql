-- Ciuna DEMO DATA: Food and Mart products, delivery zones, three demo experts with services and open slots.
-- Paste into the Supabase SQL Editor AFTER seller-portal-all.sql. Safe to re-run (it skips rows that already exist).
-- Every demo row is marked so demo-data-remove.sql can delete it: products have owner_team = 'demo';
-- demo vendors, experts and merchants have a slug starting with 'demo-'.
-- Prices are RUB. Images are empty on purpose: add real photos in Seller.
begin;
set local lock_timeout = '5s';

-- ---------------------------------------------------------------------------------------------
-- Food products on the existing Food stores
-- ---------------------------------------------------------------------------------------------
insert into hub_products (title, short_description, category, status, pricing_type, fixed_amount, fixed_currency, list_price, sale_price,
                          service_line_slug, vendor_id, stock_quantity, sold_out, fulfillment_type, fulfillment_mode, owner_team, review_status)
select p.title, p.descr, p.category, 'live', 'fixed', p.price, 'RUB', p.price, p.sale, 'food', v.id, p.stock, false, 'in_person', p.mode, 'demo', 'approved'
from (values
  ('lacabana',    'Jollof rice with chicken',        'Smoky party jollof with grilled chicken thigh and fried plantain.',        'Mains',     520, null::numeric, 40, 'delivery'),
  ('lacabana',    'Egusi soup with pounded yam',     'Melon-seed soup with beef and stockfish, served with pounded yam.',        'Mains',     640, 590,           25, 'delivery'),
  ('lacabana',    'Suya skewers (5 pieces)',         'Spiced beef skewers with onion, tomato and yaji pepper.',                  'Grill',     450, null,          30, 'delivery'),
  ('lacabana',    'Puff puff (10 pieces)',           'Soft, sweet fried dough balls. Best eaten warm.',                          'Snacks',    250, null,          60, 'pickup'),
  ('lacabana',    'Zobo drink 0.5 l',                'Chilled hibiscus drink with ginger and pineapple.',                        'Drinks',    180, null,          80, 'pickup'),
  ('harvest-lane','Pelmeni with beef (500 g)',       'Hand-made pelmeni, boil in 7 minutes. Frozen.',                            'Ready meals',420, null,         50, 'delivery'),
  ('harvest-lane','Borscht with sour cream',         'Classic beet soup with beef, ready to heat. 700 ml.',                      'Ready meals',380, 340,          35, 'delivery'),
  ('harvest-lane','Syrniki with berry jam (6 pcs)',  'Fried cottage-cheese pancakes with homemade jam.',                         'Breakfast', 330, null,          30, 'pickup'),
  ('harvest-lane','Blini with salmon and cream cheese','Thin blini rolls filled with lightly salted salmon.',                   'Mains',     560, null,          20, 'delivery')
) as p(vslug, title, descr, category, price, sale, stock, mode)
join hub_vendors v on v.slug = p.vslug and v.service_line_slug = 'food'
where not exists (select 1 from hub_products x where x.vendor_id = v.id and x.title = p.title);

-- Delivery zones so delivery can be selected at checkout (Moscow)
insert into marketplace_zones (vendor_id, city, district, fee, currency, active)
select v.id, 'Moscow', z.district, z.fee, 'RUB', true
from hub_vendors v
cross join (values ('Tverskoy', 150::numeric), ('Arbat', 150), ('Khamovniki', 200), ('Yasenevo', 300)) as z(district, fee)
where v.slug in ('lacabana', 'harvest-lane')
on conflict (vendor_id, city, district) do nothing;

-- Pickup details
update hub_vendors set pickup_location = 'Tverskaya St 12, Moscow', pickup_hours = 'Mon to Sat 10:00 to 21:00'
where slug = 'lacabana' and pickup_location is null;
update hub_vendors set pickup_location = 'Pyatnitskaya St 25, Moscow', pickup_hours = 'Daily 09:00 to 20:00'
where slug = 'harvest-lane' and pickup_location is null;

-- ---------------------------------------------------------------------------------------------
-- Two demo Mart stores with their merchants, and products
-- ---------------------------------------------------------------------------------------------
insert into merchants (type, slug, display_name, country, operating_country, languages, default_language, default_currency, status, kyb_tier, description)
select 'store', s.slug, s.name, s.country, 'RU', s.langs, s.lang, 'RUB', 'live', 1, jsonb_build_object('en', s.bio)
from (values
  ('demo-guangzhou-market', 'Guangzhou Market', 'CN', array['en','ru','zh'], 'zh', 'Asian groceries, sauces, noodles and snacks delivered across Moscow.'),
  ('demo-latina-despensa',  'Latina Despensa',  'CO', array['en','ru','es'], 'es', 'Latin American pantry staples: masa, beans, sauces and sweets.')
) as s(slug, name, country, langs, lang, bio)
where not exists (select 1 from merchants m where m.slug = s.slug);

insert into hub_vendors (service_line_slug, name, slug, short_bio, is_published, is_verified, location, pickup_location, pickup_hours, owner_team, merchant_id)
select 'mart', s.name, s.slug, s.bio, true, true, 'Moscow, Russia', s.pickup, s.hours, 'demo', m.id
from (values
  ('demo-guangzhou-market', 'Guangzhou Market', 'Asian groceries, sauces, noodles and snacks.', 'Dmitrovskoye Sh. 100, Moscow', 'Daily 10:00 to 22:00'),
  ('demo-latina-despensa',  'Latina Despensa',  'Latin American pantry staples and sweets.',      'Ulitsa Arbat 20, Moscow',       'Mon to Sat 11:00 to 20:00')
) as s(slug, name, bio, pickup, hours)
join merchants m on m.slug = s.slug
where not exists (select 1 from hub_vendors v where v.slug = s.slug);

insert into marketplace_zones (vendor_id, city, district, fee, currency, active)
select v.id, 'Moscow', z.district, z.fee, 'RUB', true
from hub_vendors v
cross join (values ('Tverskoy', 200::numeric), ('Khamovniki', 250), ('Yasenevo', 350)) as z(district, fee)
where v.slug in ('demo-guangzhou-market', 'demo-latina-despensa')
on conflict (vendor_id, city, district) do nothing;

insert into hub_products (title, short_description, category, status, pricing_type, fixed_amount, fixed_currency, list_price, sale_price,
                          service_line_slug, vendor_id, stock_quantity, sold_out, fulfillment_type, fulfillment_mode, owner_team, review_status, merchant_id)
select p.title, p.descr, p.category, 'live', 'fixed', p.price, 'RUB', p.price, p.sale, 'mart', v.id, p.stock, p.out, 'in_person', p.mode, 'demo', 'approved', v.merchant_id
from (values
  ('demo-guangzhou-market', 'Lao Gan Ma chili crisp 210 g',   'The classic crunchy chili oil with fermented soybeans.',     'Sauces',   290, null::numeric, 120, false, 'delivery'),
  ('demo-guangzhou-market', 'Instant ramen, spicy beef (5 pack)','Korean-style spicy ramen, 5 x 120 g.',                    'Noodles',  420, 380,            80, false, 'delivery'),
  ('demo-guangzhou-market', 'Jasmine rice 2 kg',              'Long-grain fragrant jasmine rice.',                          'Staples',  610, null,           60, false, 'delivery'),
  ('demo-guangzhou-market', 'Soy sauce, dark, 500 ml',        'Naturally brewed dark soy sauce.',                           'Sauces',   240, null,           90, false, 'pickup'),
  ('demo-guangzhou-market', 'Matcha powder 100 g',            'Ceremonial-grade matcha for lattes and baking.',             'Drinks',   980, null,            0, true,  'delivery'),
  ('demo-latina-despensa',  'Harina PAN white corn flour 1 kg','For arepas and empanadas.',                                 'Staples',  340, null,           70, false, 'delivery'),
  ('demo-latina-despensa',  'Black beans 900 g',              'Dried black beans, ready in about an hour.',                 'Staples',  260, null,           55, false, 'delivery'),
  ('demo-latina-despensa',  'Hot sauce, habanero 150 ml',     'Fruity, fiery habanero sauce.',                              'Sauces',   310, 280,            40, false, 'pickup'),
  ('demo-latina-despensa',  'Dulce de leche 450 g',           'Thick caramel spread, classic Argentine style.',             'Sweets',   450, null,           35, false, 'delivery')
) as p(vslug, title, descr, category, price, sale, stock, out, mode)
join hub_vendors v on v.slug = p.vslug
where not exists (select 1 from hub_products x where x.vendor_id = v.id and x.title = p.title);

-- ---------------------------------------------------------------------------------------------
-- Three demo experts, each with a merchant, a service and open slots for the next 14 days
-- ---------------------------------------------------------------------------------------------
insert into merchants (type, slug, display_name, country, operating_country, languages, default_language, default_currency, status, kyb_tier, description)
select 'expert', s.slug, s.name, s.country, 'RU', s.langs, 'en', 'RUB', 'live', 1, jsonb_build_object('en', s.bio)
from (values
  ('demo-amina-yusuf',  'Dr. Amina Yusuf',  'NG', array['en','ru'],      'Immigration lawyer for work permits, residence permits and citizenship in Russia.'),
  ('demo-li-wei',       'Li Wei',           'CN', array['en','ru','zh'], 'Russian tutor for exams and daily life, taught in English and Chinese.'),
  ('demo-carlos-mendes','Carlos Mendes',    'MX', array['en','ru','es'], 'Sworn translator for Spanish and Russian documents.')
) as s(slug, name, country, langs, bio)
where not exists (select 1 from merchants m where m.slug = s.slug);

insert into expert_profiles (display_name, headline, bio, is_published, category, capabilities, fulfillment_type, service_area, slug, merchant_id)
select s.name, s.headline, s.bio, true, s.category, '{}'::jsonb, 'online', 'Moscow, Russia (online)', s.slug, m.id
from (values
  ('demo-amina-yusuf',  'Dr. Amina Yusuf',  'Immigration lawyer',      'Work permits, residence permits and citizenship.', 'Ten years helping foreigners settle in Russia: applications, appeals and document checks.', 'Legal'),
  ('demo-li-wei',       'Li Wei',           'Russian tutor',           'Russian for exams and everyday life.',            'Patient one-to-one lessons for TORFL, university entry and daily conversation.', 'Education'),
  ('demo-carlos-mendes','Carlos Mendes',    'Sworn translator',        'Certified Spanish and Russian translation.',       'Certified translations of diplomas, certificates and contracts, accepted by Russian authorities.', 'Translation')
) as s(slug, name, tag, headline, bio, category)
join merchants m on m.slug = s.slug
where not exists (select 1 from expert_profiles e where e.slug = s.slug);

insert into expert_services (expert_profile_id, title, short_description, sort_order, is_published, pricing_type, hourly_rate, hourly_currency,
                             fixed_amount, fixed_currency, fulfillment_type, booking_lead_minutes, payment_cutoff_minutes, meeting_instructions, timezone, review_status)
select e.id, s.title, s.descr, 1, true, s.ptype, s.hourly, 'RUB', s.fixed, 'RUB', 'online', 120, 60,
       'Online session. The meeting link is sent after the expert accepts your booking.', 'Europe/Moscow', 'approved'
from (values
  ('demo-amina-yusuf',  'Immigration consultation (60 min)', 'Review your case and next steps for a permit or residence.', 'hourly', 4500::numeric, null::numeric),
  ('demo-li-wei',       'Russian lesson (60 min)',           'One-to-one lesson, any level, English or Chinese support.',      'hourly', 1500,           null),
  ('demo-carlos-mendes','Document translation check',        'Certified translation of one document, up to 2 pages.',          'fixed',  null,           2400)
) as s(slug, title, descr, ptype, hourly, fixed)
join expert_profiles e on e.slug = s.slug
where not exists (select 1 from expert_services x where x.expert_profile_id = e.id and x.title = s.title);

-- Schedule window and hourly slots 10:00 to 16:00 (last slot starts 15:00) Moscow time on weekdays for the next 14 days
insert into expert_service_schedules (expert_service_id, timezone, window_start_date, window_end_date, slot_duration_minutes)
select x.id, 'Europe/Moscow', (now() at time zone 'Europe/Moscow')::date, (now() at time zone 'Europe/Moscow')::date + 14, 60
from expert_services x join expert_profiles e on e.id = x.expert_profile_id
where e.slug like 'demo-%' and not exists (select 1 from expert_service_schedules sc where sc.expert_service_id = x.id);

insert into expert_service_slots (expert_service_id, slot_start, slot_end, status, source, schedule_id)
select x.id, s.start_at, s.start_at + interval '60 minutes', 'available', 'schedule', sc.id
from expert_services x
join expert_profiles e on e.id = x.expert_profile_id and e.slug like 'demo-%'
join expert_service_schedules sc on sc.expert_service_id = x.id
cross join lateral (
  select (((((now() at time zone 'Europe/Moscow')::date + n) + h * interval '1 hour')) at time zone 'Europe/Moscow') as start_at
  from generate_series(1, 14) n,
       generate_series(10, 15) h
  where extract(isodow from (now() at time zone 'Europe/Moscow')::date + n) between 1 and 5
) s
where not exists (select 1 from expert_service_slots t where t.expert_service_id = x.id and t.slot_start = s.start_at);

commit;

-- Check after running:
--   select service_line_slug, count(*) from hub_products where status = 'live' group by 1;      (food 9, mart 9)
--   select count(*) from expert_service_slots where source = 'schedule' and status = 'available';

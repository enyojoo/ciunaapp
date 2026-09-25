-- Read-only pre-release checks. Correct reported catalog rows in Office before enabling a line.
select id,title,service_line_slug,fulfillment_type from hub_products
where status='live' and (fulfillment_mode is null or service_line_slug not in ('food','mart')
 or (fulfillment_mode in ('delivery','pickup') and vendor_id is null));
select p.id,p.title,p.category from hub_products p where p.status='live' and
 (p.service_line_slug='food' and p.category not in ('Meals','Snacks','Drinks','Other')
 or p.service_line_slug='mart' and p.category not in ('Groceries','Household','Electronics','Other'));
select s.id,s.title from expert_services s where s.is_published and s.pricing_type<>'quote'
 and (nullif(trim(s.meeting_instructions),'') is null or not exists
 (select 1 from expert_service_slots sl where sl.expert_service_id=s.id and sl.status='available'
 and sl.slot_start>now()+make_interval(mins=>s.booking_lead_minutes)));
select id,public_id,exception_reason,payment_state,fulfillment_state,owner_team from marketplace_orders
where exception_reason is not null or overdue_at is not null or payment_state='refund_pending';
select * from marketplace_worker_health;
select kind,state,count(*),min(available_at) as oldest_due from marketplace_jobs where state<>'done' group by kind,state;

-- RLS must be enabled on every marketplace lifecycle table (no client policies; service_role only).
select c.relname as table_without_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'marketplace_zones','marketplace_quotes','marketplace_orders','marketplace_attempts',
    'marketplace_reservations','marketplace_events','marketplace_refunds','marketplace_jobs',
    'marketplace_worker_health'
  )
  and not c.relrowsecurity;

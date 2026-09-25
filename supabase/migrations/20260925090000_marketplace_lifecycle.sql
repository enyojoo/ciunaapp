-- Additive marketplace lifecycle. Apply only after schema-baseline preflight.
begin;
alter table hub_products
  add column if not exists long_description text,
  add column if not exists form_schema jsonb not null default '[]',
  add column if not exists fulfillment_mode text check (fulfillment_mode in ('delivery','pickup','digital')),
  add column if not exists require_phone boolean,
  add column if not exists owner_team text not null default 'operations';
update hub_products set fulfillment_mode = case fulfillment_type when 'online' then 'digital' when 'in_person' then 'delivery' end where fulfillment_mode is null and fulfillment_type in ('online','in_person');
alter table hub_vendors add column if not exists pickup_location text, add column if not exists pickup_hours text,
  add column if not exists fulfillment_notes text, add column if not exists owner_team text not null default 'operations';
alter table expert_services add column if not exists booking_lead_minutes integer not null default 120 check (booking_lead_minutes >= 0),
  add column if not exists payment_cutoff_minutes integer not null default 60 check (payment_cutoff_minutes >= 0),
  add column if not exists meeting_instructions text, add column if not exists timezone text not null default 'UTC';
alter table delivery_addresses add column if not exists city text, add column if not exists district text;
create table marketplace_zones (
 id uuid primary key default gen_random_uuid(), vendor_id uuid not null references hub_vendors(id),
 city text not null, district text not null, fee numeric(14,2) not null check(fee >= 0), currency text not null,
 active boolean not null default true, updated_at timestamptz not null default now(), unique(vendor_id,city,district)
);
create table marketplace_quotes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id),
 payload jsonb not null, expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table marketplace_orders (
 id uuid primary key default gen_random_uuid(), transaction_id uuid not null unique references transactions(id), public_id text not null unique,
 user_id uuid not null references users(id), quote_id uuid not null unique references marketplace_quotes(id),
 cart_id uuid unique references hub_carts(id), line text not null check(line in ('food','mart','experts')),
 payment_state text not null default 'awaiting_payment' check(payment_state in ('awaiting_payment','processing','paid','expired','refund_pending','refunded')),
 fulfillment_state text not null default 'awaiting_payment' check(fulfillment_state in ('awaiting_payment','awaiting_acceptance','accepted','in_progress','fulfilled','cancelled')),
 fulfillment_mode text not null check(fulfillment_mode in ('delivery','pickup','digital','online_appointment','in_person_appointment')),
 attention_due_at timestamptz, overdue_at timestamptz,
 snapshot jsonb not null, payment_deadline timestamptz not null, owner_team text not null default 'operations', assigned_to uuid,
 request_key text not null, request_hash text not null, exception_reason text, digital_content text,
 restocked_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id, request_key)
);
create table marketplace_attempts (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references marketplace_orders(id),
 rail text not null check(rail in ('manual','yookassa')), method_id uuid references payment_methods(id),
 state text not null default 'created' check(state in ('created','pending','unknown','proof_submitted','succeeded','failed','superseded')),
 active boolean not null default true, idempotency_key uuid not null unique default gen_random_uuid(),
 confirmation_mode text not null check(confirmation_mode in ('embedded','native')), provider_id text unique,
 amount numeric(14,2) not null, currency text not null, request_fingerprint text, native_payment_type text,
 confirmation_token text, confirmation_url text, request_payload jsonb, encrypted_token text,
 instructions jsonb not null default '{}', proof_path text, provider_status text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index marketplace_one_active_attempt on marketplace_attempts(order_id) where active;
create table marketplace_reservations (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references marketplace_orders(id),
 product_id uuid references hub_products(id), slot_id uuid references expert_service_slots(id),
 quantity integer not null check(quantity > 0), state text not null default 'held' check(state in ('held','consumed','released','restocked')),
 expires_at timestamptz not null, check((product_id is null) <> (slot_id is null))
);
create index marketplace_product_holds on marketplace_reservations(product_id,state,expires_at);
create unique index marketplace_slot_exclusive on marketplace_reservations(slot_id) where state in ('held','consumed');
create table marketplace_events (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references marketplace_orders(id),
 kind text not null, actor_id uuid, message text not null, customer_visible boolean not null default true,
 details jsonb not null default '{}', created_at timestamptz not null default now()
);
create table marketplace_refunds (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references marketplace_orders(id), attempt_id uuid not null unique references marketplace_attempts(id),
 amount numeric(14,2) not null check(amount > 0), currency text not null, state text not null default 'pending' check(state in ('pending','completed')),
 reason text not null, reference text, actor_id uuid, created_at timestamptz not null default now(), completed_at timestamptz
);
create table marketplace_jobs (
 id uuid primary key default gen_random_uuid(), kind text not null, dedupe_key text not null unique, payload jsonb not null,
 state text not null default 'ready' check(state in ('ready','running','done','failed')), available_at timestamptz not null default now(),
 lease_until timestamptz, lease_token uuid, attempts integer not null default 0, last_error text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index marketplace_jobs_due on marketplace_jobs(state,available_at,lease_until);
create table marketplace_worker_health (id text primary key, last_started_at timestamptz, last_completed_at timestamptz, last_error text);

-- All marketplace lifecycle access is via the service-role API (security-definer RPCs).
-- RLS is on with no policies: anon/authenticated get zero rows; grants are revoked.
-- Do not FORCE RLS: SECURITY DEFINER RPCs run as the table owner and must still work.
do $$ declare t text; begin
 foreach t in array array[
   'marketplace_zones','marketplace_quotes','marketplace_orders','marketplace_attempts',
   'marketplace_reservations','marketplace_events','marketplace_refunds','marketplace_jobs',
   'marketplace_worker_health'
 ] loop
  execute format('alter table %I enable row level security', t);
  execute format('revoke all on table %I from public, anon, authenticated', t);
  execute format('grant all on table %I to service_role', t);
 end loop;
 if exists (
   select 1 from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = any(array[
       'marketplace_zones','marketplace_quotes','marketplace_orders','marketplace_attempts',
       'marketplace_reservations','marketplace_events','marketplace_refunds','marketplace_jobs',
       'marketplace_worker_health'
     ])
     and c.relkind = 'r'
     and not c.relrowsecurity
 ) then
  raise exception 'marketplace RLS not enabled on all lifecycle tables';
 end if;
end $$;

create function marketplace_event(p_order uuid,p_kind text,p_actor uuid,p_message text,p_visible boolean default true,p_details jsonb default '{}') returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare eid uuid;
begin
 insert into marketplace_events(order_id,kind,actor_id,message,customer_visible,details) values(p_order,p_kind,p_actor,p_message,p_visible,p_details-'digitalContent') returning id into eid;
 if p_visible then
 insert into marketplace_jobs(kind,dedupe_key,payload) values('notify',eid::text,jsonb_build_object('orderId',p_order,'eventId',eid));
 end if;
end $$;

create function marketplace_create_order(p_user uuid,p_quote uuid,p_key text,p_hash text,p_contact jsonb,p_rail text,p_method uuid,p_mode text,p_public text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare q marketplace_quotes; o marketplace_orders; pr hub_products; sl expert_service_slots;
 item jsonb; pay jsonb; snap jsonb; method jsonb; oid uuid; tid uuid; aid uuid; cid uuid; held bigint; deadline timestamptz; mins integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_key,0));
 select * into o from marketplace_orders where user_id=p_user and request_key=p_key;
 if found then
 if o.request_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
 return o.id;
 end if;
 select * into q from marketplace_quotes where id=p_quote and user_id=p_user for update;
 if not found or q.expires_at<=now() then raise exception 'QUOTE_EXPIRED'; end if;
 if exists(select 1 from marketplace_orders where quote_id=p_quote) then raise exception 'QUOTE_ALREADY_USED'; end if;
 pay:=q.payload; snap:=pay->'snapshot';
 if p_rail not in ('manual','yookassa') or p_mode not in ('embedded','native') then raise exception 'INVALID_PAYMENT_METHOD'; end if;
 select value into method from jsonb_array_elements(snap->'methods') where value->>'rail'=p_rail and (p_rail='yookassa' or value->>'id'=p_method::text) limit 1;
 if method is null then raise exception 'INVALID_PAYMENT_METHOD'; end if;
 if p_rail='manual' and not exists(select 1 from payment_methods where id=p_method and status='active' and coalesce(provider,'manual')='manual' and upper(currency)=snap#>>'{totals,payCurrency}' and to_jsonb(payment_methods)=pay->'methodRows'->p_method::text) then raise exception 'PAYMENT_METHOD_CHANGED'; end if;
 if pay->'rateRow' is not null then
 perform 1 from exchange_rates where id=(pay#>>'{rateRow,id}')::uuid and status='active' and to_jsonb(exchange_rates)=pay->'rateRow' for share;
 if not found then raise exception 'PRICE_CHANGED'; end if;
 end if;
 cid:=nullif(pay->>'cartId','')::uuid;
 if cid is not null then
 perform 1 from hub_carts where id=cid and user_id=p_user and status='active' for update;
 if not found then raise exception 'CART_CONVERTED'; end if;
 if (select coalesce(jsonb_agg(jsonb_build_object('id',hub_product_id,'quantity',quantity) order by hub_product_id),'[]') from hub_cart_items where cart_id=cid) <> pay->'cartItems' then raise exception 'CART_CHANGED'; end if;
 end if;
 if pay->>'vendorId' is not null then
 perform 1 from hub_vendors where id=(pay->>'vendorId')::uuid and is_published and updated_at=(pay->>'vendorVersion')::timestamptz for share;
 if not found then raise exception 'CATALOG_CHANGED'; end if;
 end if;
 if snap->>'fulfillmentMode'='delivery' then
 perform 1 from marketplace_zones where id=(snap->>'deliveryZoneId')::uuid and active and to_jsonb(marketplace_zones)=pay->'zoneRow' for share;
 if not found then raise exception 'DELIVERY_UNAVAILABLE'; end if;
 end if;
 for item in select value from jsonb_array_elements(snap->'lines') order by value->>'productId' loop
 if item->>'productId' is not null then
 select * into pr from hub_products where id=(item->>'productId')::uuid for update;
 if not found or pr.status<>'live' or pr.sold_out then raise exception 'OUT_OF_STOCK'; end if;
 if pr.updated_at<>(pay->'productVersions'->>pr.id::text)::timestamptz then raise exception 'PRICE_CHANGED'; end if;
 -- Expired holds cannot block new buyers; their late payments take the exception path.
 update marketplace_reservations set state='released' where product_id=pr.id and state='held' and expires_at<=now();
 select coalesce(sum(quantity),0) into held from marketplace_reservations where product_id=pr.id and state='held';
 if pr.stock_quantity is not null and pr.stock_quantity-held < (item->>'quantity')::integer then raise exception 'OUT_OF_STOCK'; end if;
 end if;
 end loop;
 if pay->>'slotId' is not null then
 select * into sl from expert_service_slots where id=(pay->>'slotId')::uuid for update;
 if not found or sl.slot_start is distinct from (snap->>'slotStart')::timestamptz or sl.slot_end is distinct from (snap->>'slotEnd')::timestamptz or sl.status<>'available' or sl.slot_start <= now()+make_interval(mins=>coalesce((pay->>'leadMinutes')::integer,120)) then raise exception 'SLOT_UNAVAILABLE'; end if;
 perform 1 from expert_services s join expert_profiles p on p.id=s.expert_profile_id where s.id=sl.expert_service_id and s.is_published and p.is_published and s.updated_at=(pay->>'serviceVersion')::timestamptz and p.updated_at=(pay->>'profileVersion')::timestamptz for share of s,p;
 if not found then raise exception 'CATALOG_CHANGED'; end if;
 update marketplace_reservations set state='released' where slot_id=sl.id and state='held' and expires_at<=now();
 if exists(select 1 from marketplace_reservations where slot_id=sl.id and state in ('held','consumed')) then raise exception 'SLOT_UNAVAILABLE'; end if;
 end if;
 mins:=case when p_rail='yookassa' then 15 when snap->>'line'='food' then 30 when snap->>'line'='experts' then 60 else 120 end;
 deadline:=now()+make_interval(mins=>mins);
 if sl.id is not null then deadline:=least(deadline,sl.slot_start-make_interval(mins=>coalesce((pay->>'cutoffMinutes')::integer,60))); end if;
 if deadline<=now() then raise exception 'SLOT_UNAVAILABLE'; end if;
 insert into transactions(transaction_id,user_id,send_amount,send_currency,receive_amount,receive_currency,exchange_rate,fee_amount,fee_type,total_amount,status,fulfillment_type,transaction_source,hub_snapshot,hub_fee_amount,payment_provider,logistics_fee_amount,delivery_address_line,delivery_phone)
 values(p_public,p_user,round((snap#>>'{totals,subtotal}')::numeric/(snap#>>'{totals,exchangeRate}')::numeric,2),snap#>>'{totals,payCurrency}',(snap#>>'{totals,subtotal}')::numeric,snap#>>'{totals,productCurrency}',(snap#>>'{totals,exchangeRate}')::numeric,(snap#>>'{totals,corridorFee}')::numeric,'fixed',(snap#>>'{totals,total}')::numeric,'pending','bank_transfer','hub',jsonb_build_object('productTitle',snap->>'title','contactName',p_contact->>'contactName','contactPhone',p_contact->>'contactPhone','items',snap->'lines'),round((snap#>>'{totals,marketplaceFee}')::numeric/(snap#>>'{totals,exchangeRate}')::numeric,2),p_rail,round((snap#>>'{totals,deliveryFee}')::numeric/(snap#>>'{totals,exchangeRate}')::numeric,2),p_contact->>'deliveryAddressLine',p_contact->>'contactPhone') returning id into tid;
 insert into marketplace_orders(transaction_id,public_id,user_id,quote_id,cart_id,line,fulfillment_mode,snapshot,payment_deadline,request_key,request_hash,owner_team)
 values(tid,p_public,p_user,p_quote,cid,snap->>'line',snap->>'fulfillmentMode',snap||p_contact,deadline,p_key,p_hash,coalesce(nullif(pay->>'ownerTeam',''),'operations')) returning id into oid;
 for item in select value from jsonb_array_elements(snap->'lines') loop
 insert into hub_order_items(transaction_id,hub_product_id,title,unit_price,currency,quantity,line_total)
 values(tid,(item->>'productId')::uuid,item->>'title',(item->>'unitPrice')::numeric,snap#>>'{totals,productCurrency}',(item->>'quantity')::integer,round((item->>'unitPrice')::numeric*(item->>'quantity')::integer,2));
 if item->>'productId' is not null then insert into marketplace_reservations(order_id,product_id,quantity,expires_at) values(oid,(item->>'productId')::uuid,(item->>'quantity')::integer,deadline); end if;
 end loop;
 if sl.id is not null then
 insert into marketplace_reservations(order_id,slot_id,quantity,expires_at) values(oid,sl.id,1,deadline);
 insert into expert_bookings(user_id,expert_profile_id,expert_service_id,expert_service_slot_id,status,slot_start,slot_end,transaction_id,pricing_type_snapshot,message)
 values(p_user,(pay->>'profileId')::uuid,sl.expert_service_id,sl.id,'pending',sl.slot_start,sl.slot_end,p_public,pay->>'pricingType',p_contact->>'note');
 end if;
 insert into marketplace_attempts(order_id,rail,method_id,confirmation_mode,instructions,amount,currency) values(oid,p_rail,p_method,p_mode,coalesce(method->'instructions','{}'),(snap#>>'{totals,total}')::numeric,snap#>>'{totals,payCurrency}') returning id into aid;
 if cid is not null then update hub_carts set status='converted',updated_at=now() where id=cid; end if;
 insert into marketplace_jobs(kind,dedupe_key,payload,available_at) values('expire','expire:'||oid,jsonb_build_object('orderId',oid),deadline);
 if p_rail='yookassa' then insert into marketplace_jobs(kind,dedupe_key,payload) values('reconcile','reconcile:'||aid,jsonb_build_object('attemptId',aid)); end if;
 perform marketplace_event(oid,'created',p_user,'Order placed. Awaiting payment.');
 return oid;
end $$;

create function marketplace_transition(p_order uuid,p_action text,p_actor uuid,p_data jsonb default '{}') returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare o marketplace_orders; a marketplace_attempts; r marketplace_reservations; message text; late boolean:=false; n integer; ref text;
begin
 select * into o from marketplace_orders where id=p_order for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 perform set_config('ciuna.marketplace_transition','on',true);
 if p_data->>'attemptId' is not null then select * into a from marketplace_attempts where id=(p_data->>'attemptId')::uuid and order_id=o.id for update; end if;
 if p_action in ('paid','failed','unknown','proof','pending') and a.id is null then raise exception 'ATTEMPT_NOT_FOUND'; end if;
 if p_action='paid' then
 if a.state='succeeded' then return; end if;
 if a.rail='manual' and p_actor is null then raise exception 'ADMIN_REQUIRED'; end if;
 update marketplace_attempts set state='succeeded',active=false,encrypted_token=null,updated_at=now() where id=a.id;
 if o.payment_state in ('paid','refund_pending','refunded') or o.fulfillment_state='cancelled' then
 insert into marketplace_refunds(order_id,attempt_id,amount,currency,reason) values(o.id,a.id,(o.snapshot#>>'{totals,total}')::numeric,o.snapshot#>>'{totals,payCurrency}','Payment after cancellation or duplicate payment') on conflict(attempt_id) do nothing;
 update marketplace_orders set payment_state=case when o.fulfillment_state='cancelled' then 'refund_pending' else payment_state end,exception_reason='REFUND_REQUIRED' where id=o.id;
 else
 late:=o.payment_deadline<=now() or exists(select 1 from marketplace_reservations where order_id=o.id and state='released');
 if not late then
 for r in select * from marketplace_reservations where order_id=o.id and state='held' order by product_id,slot_id for update loop
 if r.product_id is not null then update hub_products set stock_quantity=stock_quantity-r.quantity where id=r.product_id and (stock_quantity is null or stock_quantity>=r.quantity); if not found then raise exception 'OUT_OF_STOCK'; end if;
 else update expert_service_slots set status='booked',updated_at=now() where id=r.slot_id and status='available'; if not found then raise exception 'SLOT_UNAVAILABLE'; end if; end if;
 update marketplace_reservations set state='consumed' where id=r.id;
 end loop;
 else update marketplace_reservations set state='released' where order_id=o.id and state='held'; end if;
 update marketplace_orders set payment_state='paid',fulfillment_state='awaiting_acceptance',attention_due_at=now()+make_interval(mins=>case o.line when 'food' then 10 when 'experts' then 30 else 120 end),exception_reason=case when late then 'LATE_PAYMENT' end where id=o.id;
 end if;
 update transactions set status='completed',completed_at=now(),updated_at=now() where id=o.transaction_id;
 message:='Payment received. Awaiting Office confirmation.';
 elsif p_action='pending' then
 if a.state in ('succeeded','failed','superseded') then return; end if;
 update marketplace_attempts set state='pending',updated_at=now() where id=a.id;
 update marketplace_orders set payment_state=case when payment_state='processing' then 'awaiting_payment' else payment_state end,exception_reason=case when exception_reason='PAYMENT_UNRESOLVED' then null else exception_reason end where id=o.id;
 return;
 elsif p_action='unknown' then
 if a.state='unknown' and o.exception_reason='PAYMENT_UNRESOLVED' then return; end if;
 if a.state in ('succeeded','failed','superseded') then return; end if;
 update marketplace_attempts set state='unknown',updated_at=now() where id=a.id;
 update marketplace_orders set payment_state=case when payment_state='awaiting_payment' then 'processing' else payment_state end,exception_reason='PAYMENT_UNRESOLVED' where id=o.id;
 message:='Checking payment. Please do not pay again.';
 elsif p_action='failed' then
 if a.state in ('succeeded','failed') then return; end if;
 update marketplace_attempts set state='failed',active=false,encrypted_token=null,updated_at=now() where id=a.id;
 update marketplace_orders set payment_state=case when payment_state='processing' then 'awaiting_payment' else payment_state end,exception_reason=null where id=o.id;
 message:='Payment attempt failed.';
 elsif p_action='expire' then
 if o.payment_deadline>now() or o.payment_state in ('paid','refund_pending','refunded') then return; end if;
 if o.payment_state='expired' then return; end if;
 update marketplace_reservations set state='released' where order_id=o.id and state='held';
 update marketplace_orders set payment_state='expired' where id=o.id;
 update marketplace_attempts set active=false,state='superseded' where order_id=o.id and rail='manual' and state='created';
 message:='Payment deadline passed. Contact support if you have paid.';
 elsif p_action='proof' then
 if a.rail<>'manual' or not a.active or a.state not in ('created','proof_submitted') then raise exception 'INVALID_TRANSITION'; end if;
 update marketplace_attempts set proof_path=p_data->>'path',state='proof_submitted',updated_at=now() where id=a.id;
 message:='Payment proof submitted for review.';
 elsif p_action='cancel' then
 if o.fulfillment_state='cancelled' then return; end if;
 if o.fulfillment_state not in ('awaiting_payment','awaiting_acceptance') then raise exception 'CONTACT_SUPPORT'; end if;
 update marketplace_orders set fulfillment_state='cancelled',overdue_at=null,attention_due_at=null,payment_state=case when payment_state='paid' then 'refund_pending' else payment_state end where id=o.id;
 update marketplace_reservations set state='released' where order_id=o.id and state='held';
 -- A consumed slot is released immediately; physical stock needs an explicit restock action.
 update expert_service_slots s set status='available',updated_at=now() from marketplace_reservations rr where rr.order_id=o.id and rr.slot_id=s.id and rr.state='consumed';
 update marketplace_reservations set state='released' where order_id=o.id and slot_id is not null and state='consumed';
 update expert_bookings set status='cancelled',updated_at=now() where transaction_id=o.public_id;
 if o.payment_state='paid' then
 insert into marketplace_refunds(order_id,attempt_id,amount,currency,reason) select o.id,id,(o.snapshot#>>'{totals,total}')::numeric,o.snapshot#>>'{totals,payCurrency}',coalesce(p_data->>'reason','Cancelled before acceptance') from marketplace_attempts where order_id=o.id and state='succeeded' on conflict(attempt_id) do nothing;
 end if;
 message:='Order cancelled.';
 elsif p_action='accept' then
 if o.fulfillment_state='accepted' then return; end if;
 if o.payment_state<>'paid' or o.fulfillment_state<>'awaiting_acceptance' or o.exception_reason is not null then raise exception 'INVALID_TRANSITION'; end if;
 update marketplace_orders set fulfillment_state='accepted',overdue_at=null,attention_due_at=case when o.line='experts' then (o.snapshot->>'slotEnd')::timestamptz else now()+make_interval(mins=>coalesce((o.snapshot->>'fulfillmentMinutes')::integer,60)) end where id=o.id;
 update expert_bookings set status='confirmed',updated_at=now() where transaction_id=o.public_id;
 message:='Order accepted.';
 elsif p_action='start' then
 if o.fulfillment_state='in_progress' then return; end if;
 if o.fulfillment_state<>'accepted' then raise exception 'INVALID_TRANSITION'; end if;
 update marketplace_orders set fulfillment_state='in_progress' where id=o.id; message:='Fulfillment in progress.';
 elsif p_action='fulfill' then
 if o.fulfillment_state='fulfilled' then return; end if;
 if o.fulfillment_state not in ('accepted','in_progress') then raise exception 'INVALID_TRANSITION'; end if;
 if o.fulfillment_mode='digital' and length(trim(coalesce(p_data->>'digitalContent','')))=0 then raise exception 'DELIVERY_CONTENT_REQUIRED'; end if;
 if o.line='experts' and (o.snapshot->>'slotEnd')::timestamptz>now() then raise exception 'SESSION_NOT_ENDED'; end if;
 if length(trim(coalesce(p_data->>'note','')))=0 then raise exception 'NOTE_REQUIRED'; end if;
 update marketplace_orders set fulfillment_state='fulfilled',overdue_at=null,attention_due_at=null,digital_content=case when fulfillment_mode='digital' then p_data->>'digitalContent' else null end where id=o.id;
 update expert_bookings set status='completed',updated_at=now() where transaction_id=o.public_id;
 message:='Order fulfilled.';
 elsif p_action='refund' then
 ref:=trim(coalesce(p_data->>'reference',''));
 if ref='' then raise exception 'REFUND_REFERENCE_REQUIRED'; end if;
 update marketplace_refunds set state='completed',reference=ref,actor_id=p_actor,completed_at=now() where id=(p_data->>'refundId')::uuid and order_id=o.id and state='pending' and amount=(p_data->>'amount')::numeric and currency=p_data->>'currency';
 if not found then raise exception 'REFUND_MISMATCH'; end if;
 if not exists(select 1 from marketplace_refunds where order_id=o.id and state='pending') then
 update marketplace_orders set payment_state=case when fulfillment_state='cancelled' then 'refunded' else payment_state end,exception_reason=null where id=o.id;
 end if; message:='Refund completed.';
 elsif p_action='restock' then
 if o.fulfillment_state<>'cancelled' then raise exception 'INVALID_TRANSITION'; end if;
 if o.restocked_at is not null then return; end if;
 for r in select * from marketplace_reservations where order_id=o.id and product_id is not null and state='consumed' order by product_id for update loop
 update hub_products set stock_quantity=stock_quantity+r.quantity where id=r.product_id;
 update marketplace_reservations set state='restocked' where id=r.id;
 end loop;
 update marketplace_orders set restocked_at=now() where id=o.id; message:='Stock restored.';
 elsif p_action='reacquire' then
 if o.exception_reason<>'LATE_PAYMENT' or o.fulfillment_state='cancelled' or o.payment_state<>'paid' then raise exception 'INVALID_TRANSITION'; end if;
 for r in select * from marketplace_reservations where order_id=o.id and state='released' order by product_id,slot_id for update loop
 if r.product_id is not null then
 perform 1 from hub_products where id=r.product_id and status='live' and not sold_out for update;
 if not found then raise exception 'OUT_OF_STOCK'; end if;
 select coalesce(sum(quantity),0) into n from marketplace_reservations where product_id=r.product_id and state='held' and expires_at>now();
 update hub_products set stock_quantity=stock_quantity-r.quantity where id=r.product_id and (stock_quantity is null or stock_quantity-n>=r.quantity);
 if not found then raise exception 'OUT_OF_STOCK'; end if;
 else
 perform 1 from expert_service_slots where id=r.slot_id and status='available' and slot_start>now()+interval '1 hour' for update;
 if not found or exists(select 1 from marketplace_reservations where slot_id=r.slot_id and state in ('held','consumed') and order_id<>o.id) then raise exception 'SLOT_UNAVAILABLE'; end if;
 update expert_service_slots set status='booked',updated_at=now() where id=r.slot_id;
 end if;
 update marketplace_reservations set state='consumed' where id=r.id;
 end loop;
 update marketplace_orders set exception_reason=null where id=o.id; message:='Availability confirmed after late payment.';
 elsif p_action='assign' then
 update marketplace_orders set assigned_to=nullif(p_data->>'assignedTo','')::uuid where id=o.id;
 message:='Operator assignment updated.';
 else raise exception 'INVALID_ACTION'; end if;
 update marketplace_orders set updated_at=now() where id=o.id;
 perform marketplace_event(o.id,p_action,p_actor,message,p_action not in ('restock','assign'),p_data);
end $$;

create function marketplace_new_attempt(p_order uuid,p_user uuid,p_rail text,p_method uuid,p_mode text,p_instructions jsonb) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare o marketplace_orders; a marketplace_attempts; aid uuid;
begin
 select * into o from marketplace_orders where id=p_order and user_id=p_user for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if o.payment_state not in ('awaiting_payment','processing') or o.fulfillment_state='cancelled' or o.payment_deadline<=now() then raise exception 'INVALID_TRANSITION'; end if;
 select * into a from marketplace_attempts where order_id=o.id and active for update;
 if found then
 if a.rail=p_rail and a.method_id is not distinct from p_method then return a.id; end if;
 if a.rail='yookassa' or a.state='proof_submitted' then raise exception 'PAYMENT_UNRESOLVED'; end if;
 update marketplace_attempts set active=false,state='superseded' where id=a.id;
 end if;
 insert into marketplace_attempts(order_id,rail,method_id,confirmation_mode,instructions,amount,currency) values(o.id,p_rail,p_method,p_mode,p_instructions,(o.snapshot#>>'{totals,total}')::numeric,o.snapshot#>>'{totals,payCurrency}') returning id into aid;
 if p_rail='yookassa' then insert into marketplace_jobs(kind,dedupe_key,payload) values('reconcile','reconcile:'||aid,jsonb_build_object('attemptId',aid)); end if;
 perform marketplace_event(o.id,'payment_method',p_user,'Payment method selected.'); return aid;
end $$;

create function marketplace_claim_jobs(p_limit integer default 20) returns setof marketplace_jobs
language sql security definer set search_path=public,pg_temp as $$
 update marketplace_jobs set state='running',lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',attempts=attempts+1,updated_at=now()
 where id in (select id from marketplace_jobs where (state='ready' and available_at<=now()) or (state='running' and lease_until<now()) order by available_at limit least(p_limit,20) for update skip locked) returning *;
$$;

create function marketplace_guard_transaction() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if exists(select 1 from marketplace_orders where transaction_id=old.id) and (coalesce(current_setting('ciuna.marketplace_transition',true),'')<>'on' or coalesce(current_setting('role',true),'') in ('anon','authenticated')) then
 if (to_jsonb(new)-array['receipt_url','receipt_filename','updated_at']) is distinct from (to_jsonb(old)-array['receipt_url','receipt_filename','updated_at']) then raise exception 'USE_MARKETPLACE_ACTION'; end if;
 end if;
 return new;
end $$;
create trigger marketplace_transaction_guard before update on transactions for each row execute function marketplace_guard_transaction();
-- Prevent edits to a converted cart racing its frozen snapshot.
create function marketplace_guard_cart_item() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare cid uuid; st text;
begin
 cid:=case when tg_op='DELETE' then old.cart_id else new.cart_id end;
 select status into st from hub_carts where id=cid for update;
 if st<>'active' then raise exception 'CART_CONVERTED'; end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
create trigger marketplace_cart_item_guard before insert or update or delete on hub_cart_items for each row execute function marketplace_guard_cart_item();

create function marketplace_guard_slot() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if coalesce(current_setting('ciuna.marketplace_transition',true),'')<>'on' and exists(select 1 from marketplace_reservations where slot_id=old.id and (state='consumed' or state='held' and expires_at>now())) then
 if tg_op='DELETE' then raise exception 'SLOT_RESERVED'; end if;
 if (new.status,new.slot_start,new.slot_end,new.expert_service_id) is distinct from (old.status,old.slot_start,old.slot_end,old.expert_service_id) then raise exception 'SLOT_RESERVED'; end if;
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
create trigger marketplace_slot_guard before update or delete on expert_service_slots for each row execute function marketplace_guard_slot();

create function marketplace_retry_job(p_job uuid,p_actor uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare j marketplace_jobs;
begin
 if p_actor is null then raise exception 'ADMIN_REQUIRED'; end if;
 select * into j from marketplace_jobs where id=p_job for update;
 if not found or j.state<>'failed' then raise exception 'INVALID_TRANSITION'; end if;
 update marketplace_jobs set state='ready',available_at=now(),lease_until=null,lease_token=null,attempts=0,last_error=null,updated_at=now() where id=p_job;
 perform marketplace_event((j.payload->>'orderId')::uuid,'job_retry',p_actor,'Background job retry requested.',false,jsonb_build_object('jobId',p_job));
end $$;

create function marketplace_detect_overdue() returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare o marketplace_orders;
begin
 for o in select * from marketplace_orders where attention_due_at<now() and overdue_at is null and fulfillment_state in ('awaiting_acceptance','accepted','in_progress') limit 100 for update skip locked loop
 update marketplace_orders set overdue_at=now() where id=o.id;
 perform marketplace_event(o.id,'overdue',null,'Order needs operator attention.',false);
 end loop;
end $$;

create function marketplace_guard_stock() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if coalesce(current_setting('ciuna.marketplace_transition',true),'')<>'on' and new.stock_quantity is not null and new.stock_quantity<(select coalesce(sum(quantity),0) from marketplace_reservations where product_id=old.id and state='held' and expires_at>now()) then raise exception 'STOCK_RESERVED'; end if;
 return new;
end $$;
create trigger marketplace_stock_guard before update of stock_quantity on hub_products for each row execute function marketplace_guard_stock();

-- Restrict function execution; service-role API authenticates and authorizes each caller.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'marketplace_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
commit;

-- Order-scoped chat between a customer and the seller of a paid order.
-- Service role only (RLS on, no policies). Messages are append-only; the only change allowed is read_by_other_at.
begin;

create table if not exists order_messages (
  id bigint generated always as identity primary key,
  order_id uuid not null references marketplace_orders(id),
  merchant_id uuid not null references merchants(id),
  sender_kind text not null check (sender_kind in ('customer', 'merchant')),
  sender_id uuid not null,
  body text not null check (body = btrim(body) and char_length(body) between 1 and 2000),
  language text not null default 'en',
  created_at timestamptz not null default now(),
  read_by_other_at timestamptz
);
create index if not exists order_messages_order_idx on order_messages (order_id, id);
create index if not exists order_messages_merchant_idx on order_messages (merchant_id, created_at desc);
create index if not exists order_messages_unread_idx on order_messages (order_id, sender_kind) where read_by_other_at is null;

-- Append-only: no deletes, and updates may only stamp read_by_other_at (once).
create or replace function trg_order_messages_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'MESSAGES_APPEND_ONLY'; end if;
  if (to_jsonb(new) - 'read_by_other_at') is distinct from (to_jsonb(old) - 'read_by_other_at') or old.read_by_other_at is not null then
    raise exception 'MESSAGES_APPEND_ONLY';
  end if;
  return new;
end $$;
drop trigger if exists order_messages_guard on order_messages;
create trigger order_messages_guard before update or delete on order_messages for each row execute function trg_order_messages_guard();

-- Chat exists only for paid orders that belong to a merchant; it closes 14 days after the order is fulfilled or cancelled.
create or replace function message_chat_state(p_order uuid) returns text language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when o.id is null then 'missing'
    when o.merchant_id is null or o.payment_state not in ('paid', 'refund_pending', 'refunded') then 'unavailable'
    when o.fulfillment_state in ('fulfilled', 'cancelled') and o.updated_at < now() - interval '14 days' then 'closed'
    else 'open'
  end
  from (select 1) x left join marketplace_orders o on o.id = p_order
$$;

create or replace function message_send(p_order uuid, p_sender_kind text, p_sender uuid, p_body text, p_lang text default 'en')
returns order_messages language plpgsql security definer set search_path = public, pg_temp as $$
declare o marketplace_orders; b text := btrim(coalesce(p_body, '')); lang text := lower(coalesce(nullif(btrim(p_lang), ''), 'en')); m order_messages; st text; r text;
begin
  if p_sender_kind not in ('customer', 'merchant') then raise exception 'FORBIDDEN'; end if;
  select * into o from marketplace_orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  -- side enforcement: the customer must own the order; a seller must work for its merchant with a role that handles orders
  if p_sender_kind = 'customer' then
    if o.user_id is distinct from p_sender then raise exception 'ORDER_NOT_FOUND'; end if;
  else
    select role into r from merchant_members where merchant_id = o.merchant_id and user_id = p_sender;
    if r is null or r not in ('owner', 'manager', 'staff') then raise exception 'ORDER_NOT_FOUND'; end if;
  end if;
  st := message_chat_state(p_order);
  if st = 'unavailable' then raise exception 'CHAT_UNAVAILABLE'; end if;
  if st = 'closed' then raise exception 'CHAT_CLOSED'; end if;
  if b = '' then raise exception 'MESSAGE_EMPTY'; end if;
  if char_length(b) > 2000 then raise exception 'MESSAGE_TOO_LONG'; end if;
  if lang !~ '^[a-z]{2,3}(-[a-z0-9]{2,8})?$' then lang := 'en'; end if;
  if (select count(*) from order_messages where order_id = p_order and sender_kind = p_sender_kind and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'RATE_LIMITED';
  end if;
  insert into order_messages (order_id, merchant_id, sender_kind, sender_id, body, language)
    values (p_order, o.merchant_id, p_sender_kind, p_sender, b, lang) returning * into m;
  return m;
end $$;

-- Marks the other side's messages as read. The API checks that the reader belongs to the order first.
create or replace function messages_mark_read(p_order uuid, p_reader_kind text) returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if p_reader_kind not in ('customer', 'merchant') then raise exception 'FORBIDDEN'; end if;
  update order_messages set read_by_other_at = now() where order_id = p_order and sender_kind <> p_reader_kind and read_by_other_at is null;
  get diagnostics n = row_count;
  return n;
end $$;

-- Customer unread counts per order.
create or replace function messages_unread_customer(p_user uuid) returns table (order_id uuid, unread integer)
language sql stable security definer set search_path = public, pg_temp as $$
  select m.order_id, count(*)::integer from order_messages m join marketplace_orders o on o.id = m.order_id
  where o.user_id = p_user and m.sender_kind = 'merchant' and m.read_by_other_at is null group by m.order_id
$$;

-- Seller threads: one row per order with messages, newest activity first.
create or replace function messages_threads(p_merchant uuid, p_limit integer default 100) returns table (
  order_id uuid, public_id text, contact_name text, fulfillment_state text, chat_state text,
  last_body text, last_sender_kind text, last_at timestamptz, unread integer
) language sql stable security definer set search_path = public, pg_temp as $$
  select o.id, o.public_id, o.snapshot->>'contactName', o.fulfillment_state, message_chat_state(o.id),
    left(l.body, 400), l.sender_kind, l.created_at,
    (select count(*)::integer from order_messages u where u.order_id = o.id and u.sender_kind = 'customer' and u.read_by_other_at is null)
  from marketplace_orders o
  join lateral (select body, sender_kind, created_at from order_messages x where x.order_id = o.id order by x.id desc limit 1) l on true
  where o.merchant_id = p_merchant
  order by l.created_at desc
  limit greatest(least(p_limit, 200), 1)
$$;

-- Alert kind: a customer message reaches people who handle orders.
create or replace function seller_roles_for(p_kind text) returns text[] language sql immutable as $$
  select case
    when p_kind in ('order_new', 'booking_new', 'message_new') then array['owner', 'manager', 'staff']
    when p_kind = 'payout_update' then array['owner', 'finance']
    else array['owner', 'manager']
  end
$$;

-- One alert per order per 10 minutes, so a burst of messages does not flood email or Telegram.
create or replace function trg_message_alert() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare pub text;
begin
  if new.sender_kind = 'customer' then
    select public_id into pub from marketplace_orders where id = new.order_id;
    perform seller_notify(new.merchant_id, 'message_new',
      jsonb_build_object('orderId', new.order_id, 'publicId', pub, 'preview', left(new.body, 120)),
      'message:' || new.order_id || ':' || (extract(epoch from new.created_at)::bigint / 600));
  end if;
  return new;
end $$;
drop trigger if exists order_messages_alert on order_messages;
create trigger order_messages_alert after insert on order_messages for each row execute function trg_message_alert();

alter table order_messages enable row level security;
revoke all on table order_messages from public, anon, authenticated;
grant select on table order_messages to service_role;
revoke execute on function message_chat_state(uuid), message_send(uuid, text, uuid, text, text), messages_mark_read(uuid, text),
  messages_unread_customer(uuid), messages_threads(uuid, integer) from public, anon, authenticated;
grant execute on function message_chat_state(uuid), message_send(uuid, text, uuid, text, text), messages_mark_read(uuid, text),
  messages_unread_customer(uuid), messages_threads(uuid, integer) to service_role;

commit;

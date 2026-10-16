-- Support requests (customer help threads with Office). Paste into the Supabase SQL Editor. Safe to re-run; needs seller-portal-all.sql applied first.
-- Same content as supabase/migrations/20261018100000_support_requests.sql.
-- Customer support requests: a request (topic, subject, optional order) with a thread of messages between the
-- customer and Office staff. Service role only (RLS on, no policies); the API is the only writer.
-- Status changes and unread counters happen inside the functions so a reply is one atomic step.
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

create table if not exists support_requests (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default ('SR-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  user_id uuid not null references users(id) on delete cascade,
  topic text not null check (topic in ('order', 'payment', 'transfer', 'account', 'booking', 'other')),
  subject text not null check (subject = btrim(subject) and char_length(subject) between 3 and 120),
  order_id uuid references marketplace_orders(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'awaiting_customer', 'resolved')),
  assigned_to uuid references users(id) on delete set null,
  customer_unread integer not null default 0 check (customer_unread >= 0),
  agent_unread integer not null default 0 check (agent_unread >= 0),
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_requests_user_idx on support_requests (user_id, last_message_at desc);
create index if not exists support_requests_queue_idx on support_requests (status, last_message_at desc);
create index if not exists support_requests_assignee_idx on support_requests (assigned_to) where assigned_to is not null;

create table if not exists support_messages (
  id bigint generated always as identity primary key,
  request_id uuid not null references support_requests(id) on delete cascade,
  sender_kind text not null check (sender_kind in ('customer', 'agent', 'system')),
  sender_id uuid,
  body text not null check (body = btrim(body) and char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists support_messages_request_idx on support_messages (request_id, id);

-- A customer opens a request with its first message. At most 10 unresolved requests per customer.
create or replace function support_create(p_user uuid, p_topic text, p_subject text, p_order uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare rid uuid;
begin
  if (select count(*) from support_requests where user_id = p_user and status <> 'resolved') >= 10 then
    raise exception 'SUPPORT_TOO_MANY_OPEN';
  end if;
  if p_order is not null and not exists (select 1 from marketplace_orders where id = p_order and user_id = p_user) then
    raise exception 'SUPPORT_ORDER_NOT_FOUND';
  end if;
  insert into support_requests (user_id, topic, subject, order_id, agent_unread, last_message_preview)
    values (p_user, p_topic, btrim(p_subject), p_order, 1, left(btrim(p_body), 140)) returning id into rid;
  insert into support_messages (request_id, sender_kind, sender_id, body) values (rid, 'customer', p_user, btrim(p_body));
  return rid;
end $$;

-- A reply from the customer (reopens the request, unless it was resolved more than 14 days ago) or from an agent
-- (the request now waits for the customer). Returns the message id.
create or replace function support_send(p_request uuid, p_kind text, p_sender uuid, p_body text)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare r support_requests; mid bigint;
begin
  if p_kind not in ('customer', 'agent') then raise exception 'SUPPORT_BAD_SENDER'; end if;
  select * into r from support_requests where id = p_request for update;
  if not found then raise exception 'SUPPORT_NOT_FOUND'; end if;
  if p_kind = 'customer' then
    if r.user_id <> p_sender then raise exception 'SUPPORT_NOT_FOUND'; end if;
    if r.status = 'resolved' and r.resolved_at < now() - interval '14 days' then raise exception 'SUPPORT_CLOSED'; end if;
  end if;
  insert into support_messages (request_id, sender_kind, sender_id, body) values (p_request, p_kind, p_sender, btrim(p_body)) returning id into mid;
  update support_requests set
    last_message_at = now(), last_message_preview = left(btrim(p_body), 140), updated_at = now(),
    status = case when p_kind = 'customer' then 'open' else 'awaiting_customer' end,
    resolved_at = null,
    agent_unread = agent_unread + (p_kind = 'customer')::int,
    customer_unread = customer_unread + (p_kind = 'agent')::int
  where id = p_request;
  return mid;
end $$;

-- Marks the request resolved and leaves a system line in the thread.
create or replace function support_resolve(p_request uuid, p_agent uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update support_requests set status = 'resolved', resolved_at = now(), updated_at = now(), customer_unread = customer_unread + 1
    where id = p_request and status <> 'resolved';
  if found then
    insert into support_messages (request_id, sender_kind, sender_id, body) values (p_request, 'system', p_agent, 'resolved');
  end if;
end $$;

-- The reader opened the thread: clear their unread counter.
create or replace function support_mark_read(p_request uuid, p_reader text)
returns void language sql security definer set search_path = public, pg_temp as $$
  update support_requests set
    customer_unread = case when p_reader = 'customer' then 0 else customer_unread end,
    agent_unread = case when p_reader = 'agent' then 0 else agent_unread end
  where id = p_request
$$;

do $$ declare t text; begin
  foreach t in array array['support_requests', 'support_messages'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from public, anon, authenticated', t);
    execute format('grant all on table %I to service_role', t);
  end loop;
end $$;
grant usage, select on sequence support_messages_id_seq to service_role;
revoke execute on function support_create(uuid, text, text, uuid, text), support_send(uuid, text, uuid, text), support_resolve(uuid, uuid), support_mark_read(uuid, text) from public, anon, authenticated;
grant execute on function support_create(uuid, text, text, uuid, text), support_send(uuid, text, uuid, text), support_resolve(uuid, uuid), support_mark_read(uuid, text) to service_role;

commit;

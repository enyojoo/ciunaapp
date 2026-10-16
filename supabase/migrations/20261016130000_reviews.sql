-- Ratings and reviews. One review per fulfilled order, written by the customer who placed it.
-- Same conventions as the merchant migrations: RLS on with no policies (service role only), additive,
-- security-definer functions with execute revoked from public roles.
begin;
-- Fail fast instead of queueing behind a long-running transaction (a queued ALTER blocks every later query on that table).
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references marketplace_orders(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,
  target_type text not null check (target_type in ('vendor', 'expert')),
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  language text,
  status text not null default 'published' check (status in ('published', 'hidden')),
  hidden_reason text,
  reply text check (reply is null or char_length(reply) <= 600),
  reply_at timestamptz,
  reply_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_merchant_idx on reviews (merchant_id, status, created_at desc);
create index if not exists reviews_status_idx on reviews (status, created_at desc);

alter table reviews enable row level security;
revoke all on table reviews from public, anon, authenticated;

alter table merchants add column if not exists rating_avg numeric(3, 2);
alter table merchants add column if not exists rating_count integer not null default 0;
alter table hub_vendors add column if not exists rating_avg numeric(3, 2);
alter table hub_vendors add column if not exists rating_count integer not null default 0;
alter table expert_profiles add column if not exists rating_avg numeric(3, 2);
alter table expert_profiles add column if not exists rating_count integer not null default 0;

-- Recompute from PUBLISHED reviews only, so hiding a review takes effect immediately.
create or replace function review_refresh_aggregates(p_merchant uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a numeric(3, 2); c integer;
begin
  select round(avg(rating)::numeric, 2), count(*)::integer into a, c
    from reviews where merchant_id = p_merchant and status = 'published';
  if c = 0 then a := null; end if;
  update merchants set rating_avg = a, rating_count = c where id = p_merchant;
  update hub_vendors set rating_avg = a, rating_count = c where merchant_id = p_merchant;
  update expert_profiles set rating_avg = a, rating_count = c where merchant_id = p_merchant;
end $$;

create or replace function trg_reviews_aggregate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    perform review_refresh_aggregates(old.merchant_id);
    return old;
  end if;
  perform review_refresh_aggregates(new.merchant_id);
  if tg_op = 'UPDATE' and old.merchant_id is distinct from new.merchant_id then
    perform review_refresh_aggregates(old.merchant_id);
  end if;
  return new;
end $$;

drop trigger if exists reviews_aggregate on reviews;
create trigger reviews_aggregate after insert or update of rating, status, merchant_id or delete on reviews
  for each row execute function trg_reviews_aggregate();

-- Customer writes a review (or edits it within 48 hours). Every rule lives here so no route can skip one.
create or replace function review_submit(p_order uuid, p_user uuid, p_rating integer, p_body text, p_lang text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare o marketplace_orders; r reviews; body_clean text; new_id uuid;
begin
  select * into o from marketplace_orders where id = p_order for share;
  if not found or o.user_id is distinct from p_user or o.fulfillment_state <> 'fulfilled' or o.merchant_id is null then
    raise exception 'REVIEW_NOT_ALLOWED';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'RATING_INVALID'; end if;
  body_clean := btrim(coalesce(p_body, ''));
  if char_length(body_clean) > 1000 then raise exception 'BODY_TOO_LONG'; end if;

  select * into r from reviews where order_id = p_order for update;
  if found then
    if now() - r.created_at > interval '48 hours' then raise exception 'ALREADY_REVIEWED'; end if;
    update reviews set rating = p_rating, body = body_clean, language = coalesce(nullif(btrim(p_lang), ''), language), updated_at = now()
      where id = r.id;
    return r.id;
  end if;

  if now() - o.updated_at > interval '30 days' then raise exception 'REVIEW_WINDOW_CLOSED'; end if;
  insert into reviews (order_id, user_id, merchant_id, target_type, rating, body, language)
    values (p_order, p_user, o.merchant_id, case when o.line = 'experts' then 'expert' else 'vendor' end,
            p_rating, body_clean, nullif(btrim(coalesce(p_lang, '')), ''))
    returning reviews.id into new_id;
  return new_id;
end $$;

-- Merchant replies once; the reply can be edited for 24 hours after it was first posted.
create or replace function review_reply(p_review uuid, p_merchant uuid, p_user uuid, p_reply text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r reviews; text_clean text;
begin
  select * into r from reviews where id = p_review and merchant_id = p_merchant and status = 'published' for update;
  if not found then raise exception 'REVIEW_NOT_FOUND'; end if;
  text_clean := btrim(coalesce(p_reply, ''));
  if text_clean = '' then raise exception 'REPLY_REQUIRED'; end if;
  if char_length(text_clean) > 600 then raise exception 'REPLY_TOO_LONG'; end if;
  if r.reply is not null and now() - r.reply_at > interval '24 hours' then raise exception 'REPLY_LOCKED'; end if;
  update reviews set reply = text_clean, reply_by = p_user,
    reply_at = case when r.reply is null then now() else r.reply_at end, updated_at = now()
    where id = r.id;
end $$;

-- Office hides or restores a review. Hiding needs a reason; aggregates follow through the trigger.
create or replace function review_moderate(p_review uuid, p_hide boolean, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r reviews; reason_clean text;
begin
  select * into r from reviews where id = p_review for update;
  if not found then raise exception 'REVIEW_NOT_FOUND'; end if;
  reason_clean := btrim(coalesce(p_reason, ''));
  if p_hide then
    if char_length(reason_clean) < 3 then raise exception 'REASON_REQUIRED'; end if;
    update reviews set status = 'hidden', hidden_reason = left(reason_clean, 500), updated_at = now() where id = r.id;
  else
    update reviews set status = 'published', hidden_reason = null, updated_at = now() where id = r.id;
  end if;
end $$;

-- Count of published reviews per star rating, as {"1": n, ... "5": n}.
create or replace function review_distribution(p_merchant uuid, p_target text default null) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_object_agg(s::text, coalesce(c.n, 0))
  from generate_series(1, 5) s
  left join (
    select rating, count(*)::integer n from reviews
    where merchant_id = p_merchant and status = 'published' and (p_target is null or target_type = p_target)
    group by rating
  ) c on c.rating = s
$$;

revoke execute on function
  review_refresh_aggregates(uuid), trg_reviews_aggregate(),
  review_submit(uuid, uuid, integer, text, text), review_reply(uuid, uuid, uuid, text),
  review_moderate(uuid, boolean, text), review_distribution(uuid, text)
  from public, anon, authenticated;

commit;

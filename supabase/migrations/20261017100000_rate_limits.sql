-- Fixed-window rate limiting for public and user-facing API routes. Service-role only (RLS on, no policies).
begin;

create table if not exists rate_limit_hits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
alter table rate_limit_hits enable row level security;

-- Returns true when the call is allowed, false when the limit for this window is already used up.
create or replace function rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  insert into rate_limit_hits (key, window_start, hits) values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = rate_limit_hits.hits + 1
  returning hits into n;
  -- opportunistic cleanup of old windows (about 1 call in 200)
  if random() < 0.005 then
    delete from rate_limit_hits where window_start < now() - interval '1 day';
  end if;
  return n <= p_limit;
end;
$$;

revoke all on function rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function rate_limit_hit(text, integer, integer) to service_role;

commit;

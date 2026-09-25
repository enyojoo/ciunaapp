-- Gate customer notify emails until payment progresses.
-- Events like created / payment_method still write the order timeline,
-- but do not enqueue SES notify jobs.

create or replace function marketplace_event(
  p_order uuid,
  p_kind text,
  p_actor uuid,
  p_message text,
  p_visible boolean default true,
  p_details jsonb default '{}'
) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  eid uuid;
  notify boolean;
begin
  insert into marketplace_events(order_id, kind, actor_id, message, customer_visible, details)
  values (p_order, p_kind, p_actor, p_message, p_visible, p_details - 'digitalContent')
  returning id into eid;

  -- Email only after payment confirmation / proof, or later fulfillment milestones.
  notify := p_visible and p_kind in (
    'paid',
    'proof',
    'unknown',
    'expire',
    'cancel',
    'accept',
    'start',
    'fulfill',
    'refund',
    'reacquire'
  );

  if notify then
    insert into marketplace_jobs(kind, dedupe_key, payload)
    values (
      'notify',
      eid::text,
      jsonb_build_object('orderId', p_order, 'eventId', eid)
    );
  end if;
end $$;

-- Drain already-queued pre-pay notify jobs so deploy does not SES spam open checkouts.
update marketplace_jobs j
set
  state = 'done',
  lease_until = null,
  lease_token = null,
  last_error = 'suppressed_prepay_notify',
  updated_at = now()
from marketplace_events e
where j.kind = 'notify'
  and j.state in ('ready', 'running')
  and e.id = nullif(j.payload->>'eventId', '')::uuid
  and e.kind in ('created', 'payment_method', 'failed', 'pending');

-- Marketplace health numbers for Office. One read-only function so the API stays thin and the logic is testable in SQL.
begin;

create or replace function marketplace_analytics(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare out jsonb;
begin
  if p_to <= p_from or p_to - p_from > interval '400 days' then raise exception 'RANGE_INVALID'; end if;
  select jsonb_build_object(
    'range', jsonb_build_object('from', p_from, 'to', p_to),
    -- gross merchandise value and Ciuna's take, per currency, by fulfilment date
    'money', coalesce((
      select jsonb_agg(jsonb_build_object('currency', currency, 'gmv', gmv, 'commission', commission, 'orders', n,
        'takeRate', case when items > 0 then round(commission / items * 100, 2) else 0 end) order by currency)
      from (
        select currency, sum(subtotal + delivery_fee) as gmv, sum(commission) as commission, count(*) as n, sum(subtotal) as items
        from merchant_earnings where fulfilled_at >= p_from and fulfilled_at < p_to and status <> 'reversed' group by currency
      ) s), '[]'::jsonb),
    -- paid orders by outcome, by line
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object('line', line, 'paid', paid, 'fulfilled', fulfilled, 'cancelled', cancelled, 'open', paid - fulfilled - cancelled,
        'fulfilmentRate', case when fulfilled + cancelled > 0 then round(fulfilled::numeric / (fulfilled + cancelled) * 100, 1) else null end,
        'cancellationRate', case when fulfilled + cancelled > 0 then round(cancelled::numeric / (fulfilled + cancelled) * 100, 1) else null end) order by line)
      from (
        select line, count(*) as paid,
          count(*) filter (where fulfillment_state = 'fulfilled') as fulfilled,
          count(*) filter (where fulfillment_state = 'cancelled') as cancelled
        from marketplace_orders where created_at >= p_from and created_at < p_to and merchant_id is not null
          and payment_state in ('paid', 'refund_pending', 'refunded') group by line
      ) s), '[]'::jsonb),
    'merchants', (select jsonb_build_object(
        'live', count(*) filter (where status = 'live' and not office_managed),
        'officeManaged', count(*) filter (where office_managed),
        'inReview', count(*) filter (where status = 'in_review'),
        'newInRange', count(*) filter (where created_at >= p_from and created_at < p_to and not office_managed),
        'approvedInRange', count(*) filter (where approved_at >= p_from and approved_at < p_to),
        'activeInRange', (select count(distinct merchant_id) from merchant_earnings where fulfilled_at >= p_from and fulfilled_at < p_to)
      ) from merchants),
    -- application pipeline
    'applications', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) as n from merchant_applications where submitted_at >= p_from and submitted_at < p_to group by status) s), '{}'::jsonb),
    'reviewMedianHours', (select round((percentile_cont(0.5) within group (order by extract(epoch from (reviewed_at - submitted_at)) / 3600))::numeric, 1) from merchant_applications where reviewed_at >= p_from and reviewed_at < p_to and reviewed_at is not null),
    -- how fast sellers respond: paid -> accepted, in minutes
    'acceptMedianMinutes', (select round((percentile_cont(0.5) within group (order by extract(epoch from (a.created_at - p.created_at)) / 60))::numeric, 1)
        from marketplace_events a join marketplace_events p on p.order_id = a.order_id and p.kind = 'paid'
        where a.kind = 'accept' and a.created_at >= p_from and a.created_at < p_to),
    -- activation: hours from approval to a merchant's first fulfilled order
    'timeToFirstOrderMedianHours', (select round((percentile_cont(0.5) within group (order by h))::numeric, 1) from (
        select extract(epoch from (min(e.fulfilled_at) - m.approved_at)) / 3600 as h
        from merchants m join merchant_earnings e on e.merchant_id = m.id
        where m.approved_at >= p_from and m.approved_at < p_to and not m.office_managed group by m.id, m.approved_at) s where h >= 0),
    'payouts', coalesce((select jsonb_agg(jsonb_build_object('status', status, 'currency', currency, 'count', n, 'amount', amt) order by status, currency)
        from (select status, currency, count(*) as n, sum(amount) as amt from payouts where requested_at >= p_from and requested_at < p_to group by status, currency) s), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'orders', n, 'currency', currency, 'gmv', gmv) order by d, currency)
        from (select (fulfilled_at at time zone 'UTC')::date as d, currency, count(*) as n, sum(subtotal + delivery_fee) as gmv
              from merchant_earnings where fulfilled_at >= p_from and fulfilled_at < p_to and status <> 'reversed' group by 1, 2) s), '[]'::jsonb),
    'topMerchants', coalesce((select jsonb_agg(jsonb_build_object('merchantId', id, 'name', display_name, 'currency', currency, 'gmv', gmv, 'orders', n) order by gmv desc)
        from (select m.id, m.display_name, e.currency, sum(e.subtotal + e.delivery_fee) as gmv, count(*) as n
              from merchant_earnings e join merchants m on m.id = e.merchant_id
              where e.fulfilled_at >= p_from and e.fulfilled_at < p_to and e.status <> 'reversed' group by m.id, m.display_name, e.currency order by gmv desc limit 10) s), '[]'::jsonb)
  ) into out;
  return out;
end $$;

revoke execute on function marketplace_analytics(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function marketplace_analytics(timestamptz, timestamptz) to service_role;

commit;

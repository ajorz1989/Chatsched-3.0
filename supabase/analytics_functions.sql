-- Analytics RPCs for admin dashboard
-- Returns overview metrics and time series for GMV, requests, approvals, and growth.

create or replace function public.analytics_get_overview(p_start timestamptz, p_end timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_gmv numeric := 0;
  v_total_paid_payments bigint := 0;
  v_total_requests bigint := 0;
  v_paid_requests bigint := 0;
  v_new_publishers bigint := 0;
  v_new_businesses bigint := 0;
  v_applications bigint := 0;
  v_approved_applications bigint := 0;
  v_avg_order_value numeric := 0;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'not admin');
  end if;

  -- GMV: sum of payments with status 'paid' in the period
  select coalesce(sum(payments.amount),0), coalesce(count(*) ,0)
    into v_total_gmv, v_total_paid_payments
  from public.payments
  where payments.status = 'paid' and payments.created_at >= p_start and payments.created_at <= p_end;

  -- Requests and paid requests
  select count(*) into v_total_requests from public.requests where created_at >= p_start and created_at <= p_end;

  select count(distinct requests.id) into v_paid_requests
    from public.payments
    join public.requests on payments.request_id = requests.id
    where payments.status = 'paid' and payments.created_at >= p_start and payments.created_at <= p_end;

  -- Average order value (GMV / paid requests)
  if v_paid_requests > 0 then
    v_avg_order_value := v_total_gmv / v_paid_requests;
  else
    v_avg_order_value := 0;
  end if;

  -- New publishers and new business profiles
  select count(*) into v_new_publishers from public.publishers where created_at >= p_start and created_at <= p_end;
  select count(*) into v_new_businesses from public.profiles where role = 'business' and created_at >= p_start and created_at <= p_end;

  -- Publisher applications approvals (assumes publishers.status exists and was set)
  select count(*) into v_applications from public.publishers where created_at >= p_start and created_at <= p_end;
  select count(*) into v_approved_applications from public.publishers where status = 'approved' and created_at >= p_start and created_at <= p_end;

  return jsonb_build_object(
    'ok', true,
    'total_gmv', v_total_gmv,
    'total_paid_payments', v_total_paid_payments,
    'total_requests', v_total_requests,
    'paid_requests', v_paid_requests,
    'avg_order_value', v_avg_order_value,
    'new_publishers', v_new_publishers,
    'new_businesses', v_new_businesses,
    'applications', v_applications,
    'approved_applications', v_approved_applications
  );
end;
$$;

-- Time series: returns a jsonb array of {ts, value} for the requested metric and interval
create or replace function public.analytics_time_series(p_metric text, p_interval text, p_start timestamptz, p_end timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_step interval;
  rec record;
  v_rows jsonb := '[]'::jsonb;
  v_ts timestamptz;
  v_val numeric;
  v_series record;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'not admin');
  end if;

  if p_interval = 'day' then
    v_step := '1 day'::interval;
  elsif p_interval = 'week' then
    v_step := '1 week'::interval;
  elsif p_interval = 'month' then
    v_step := '1 month'::interval;
  else
    v_step := '1 day'::interval;
  end if;

  for v_ts in select generate_series(date_trunc('day', p_start), date_trunc('day', p_end), v_step) as ts loop
    if p_metric = 'gmv' then
      select coalesce(sum(payments.amount),0) into v_val
      from public.payments
      where payments.status = 'paid' and payments.created_at >= v_ts and payments.created_at < v_ts + v_step;
    elsif p_metric = 'requests' then
      select count(*) into v_val from public.requests where requests.created_at >= v_ts and requests.created_at < v_ts + v_step;
    elsif p_metric = 'paid_requests' then
      select count(distinct requests.id) into v_val
      from public.payments
      join public.requests on payments.request_id = requests.id
      where payments.status = 'paid' and payments.created_at >= v_ts and payments.created_at < v_ts + v_step;
    elsif p_metric = 'new_publishers' then
      select count(*) into v_val from public.publishers where created_at >= v_ts and created_at < v_ts + v_step;
    elsif p_metric = 'new_businesses' then
      select count(*) into v_val from public.profiles where role = 'business' and created_at >= v_ts and created_at < v_ts + v_step;
    elsif p_metric = 'approvals' then
      select count(*) into v_val from public.publishers where status = 'approved' and created_at >= v_ts and created_at < v_ts + v_step;
    else
      v_val := 0;
    end if;

    v_rows := v_rows || jsonb_build_object('ts', v_ts, 'value', v_val);
  end loop;

  return jsonb_build_object('ok', true, 'series', v_rows);
end;
$$;

-- Segmented top lists (e.g., top publishers by GMV or requests). Returns jsonb array of {id, label, value}
create or replace function public.analytics_segmented_by(p_kind text, p_start timestamptz, p_end timestamptz, p_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows jsonb := '[]'::jsonb;
  rec record;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'not admin');
  end if;

  if p_kind = 'publisher_gmv' then
    for rec in
      select pub.id, pub.name, coalesce(sum(payments.amount),0) as total
      from public.payments
      join public.requests on payments.request_id = requests.id
      join public.publishers pub on requests.publisher_id = pub.id
      where payments.status = 'paid' and payments.created_at >= p_start and payments.created_at <= p_end
      group by pub.id, pub.name
      order by total desc
      limit p_limit
    loop
      v_rows := v_rows || jsonb_build_object('id', rec.id, 'label', rec.name, 'value', rec.total);
    end loop;
  elsif p_kind = 'publisher_requests' then
    for rec in
      select pub.id, pub.name, count(requests.*) as cnt
      from public.requests
      join public.publishers pub on requests.publisher_id = pub.id
      where requests.created_at >= p_start and requests.created_at <= p_end
      group by pub.id, pub.name
      order by cnt desc
      limit p_limit
    loop
      v_rows := v_rows || jsonb_build_object('id', rec.id, 'label', rec.name, 'value', rec.cnt);
    end loop;
  else
    -- default empty
    v_rows := '[]'::jsonb;
  end if;

  return jsonb_build_object('ok', true, 'items', v_rows);
end;
$$;

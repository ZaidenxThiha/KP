-- Phase 8/9 — automation RPCs called by the scheduled Edge Functions
-- (service role; no interactive caller).

-- Close every open round whose close_time has passed.
create or replace function public.close_due_rounds()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  with closed as (
    update public.rounds set status = 'closed'
     where status = 'open' and now() >= close_time
    returning id
  )
  select count(*) into v_count from closed;
  if v_count > 0 then
    perform public.write_audit('round.auto_close', 'rounds', null, null,
      jsonb_build_object('closed', v_count));
  end if;
  return v_count;
end;
$$;

-- When auto-settle is enabled and admin approval is not required, settle every
-- closed round that already has a result. Returns the number of rounds settled.
create or replace function public.run_auto_settlement()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_settings public.game_settings;
  v_round public.rounds;
  v_count integer := 0;
begin
  select * into v_settings from public.game_settings
   where id = '00000000-0000-0000-0000-000000000001';
  if not v_settings.auto_settle_enabled or v_settings.admin_approval_required then
    return 0;
  end if;

  for v_round in
    select * from public.rounds
     where status = 'closed'
       and coalesce(api_result_number, manual_result_number) is not null
  loop
    perform public.approve_settlement(v_round.id);
    perform public.settle_round(v_round.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Trim api_sync_logs older than 30 days (weekly cron).
create or replace function public.trim_api_sync_logs()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  with deleted as (
    delete from public.api_sync_logs
     where created_at < now() - interval '30 days' returning id
  )
  select count(*) into v_count from deleted;
  return v_count;
end;
$$;

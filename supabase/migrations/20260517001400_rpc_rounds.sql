-- Phase 5 — round lifecycle RPCs.

-- Enforced transition graph: scheduled->open->closed->resulted, plus
-- *->cancelled. Never UPDATE rounds.status directly.
create or replace function public.transition_round_status(p_round_id uuid, p_new_status text)
returns public.rounds language plpgsql security definer set search_path = public as $$
declare
  v_round public.rounds;
  v_allowed boolean;
begin
  perform public.require_role('admin');
  select * into v_round from public.rounds where id = p_round_id for update;
  if v_round.id is null then perform public.app_error('not_found'); end if;

  v_allowed := case
    when p_new_status = 'open'      and v_round.status = 'scheduled' then true
    when p_new_status = 'closed'    and v_round.status = 'open'      then true
    when p_new_status = 'resulted'  and v_round.status = 'closed'    then true
    when p_new_status = 'cancelled' and v_round.status in ('scheduled','open','closed') then true
    else false
  end;
  if not v_allowed then
    perform public.app_error('conflict',
      jsonb_build_object('from', v_round.status, 'to', p_new_status));
  end if;

  update public.rounds set status = p_new_status where id = p_round_id
  returning * into v_round;
  perform public.write_audit('round.transition', 'rounds', p_round_id,
    jsonb_build_object('status', v_round.status), jsonb_build_object('status', p_new_status));
  return v_round;
end;
$$;

-- Admin creates a manual round (no external draw link). Optional args trail so
-- generated types mark them optional.
create or replace function public.create_manual_round(
  p_game_type text, p_round_date date, p_close_time timestamptz,
  p_round_name text default 'all', p_open_time timestamptz default null,
  p_market text default 'thai_myanmar')
returns public.rounds language plpgsql security definer set search_path = public as $$
declare
  v_admin public.profiles;
  v_round public.rounds;
begin
  v_admin := public.require_role('admin');
  if p_game_type not in ('2d','3d') then perform public.app_error('invalid_input'); end if;
  if p_close_time is null or p_close_time <= now() then
    perform public.app_error('invalid_input');
  end if;

  insert into public.rounds(game_type, market, round_name, round_date,
                            open_time, close_time, status, created_by)
  values (p_game_type, p_market, coalesce(p_round_name,'all'), p_round_date,
          p_open_time, p_close_time, 'open', v_admin.id)
  returning * into v_round;

  perform public.write_audit('round.create', 'rounds', v_round.id, null, to_jsonb(v_round));
  return v_round;
end;
$$;

grant execute on function public.transition_round_status(uuid, text) to authenticated;
grant execute on function public.create_manual_round(text, date, timestamptz, text, timestamptz, text)
  to authenticated;

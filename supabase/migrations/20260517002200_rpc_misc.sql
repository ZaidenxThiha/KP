-- Misc RPCs backing route handlers that also touch auth.admin.

-- Let a privileged route handler append an audit row for an action it
-- performed itself (e.g. password reset via auth.admin).
create or replace function public.record_audit(
  p_action text, p_table text, p_target uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_role text;
begin
  v_role := public.auth_role();
  if v_role not in ('admin', 'officer') then
    perform public.app_error('forbidden');
  end if;
  perform public.write_audit(p_action, p_table, p_target, null, null, p_note);
end;
$$;

-- Admin sets an officer's distribution caps.
create or replace function public.admin_set_officer_limits(
  p_officer_id uuid, p_daily_give_limit bigint default null,
  p_max_give_per_player bigint default null, p_can_grant_welcome_bonus boolean default true)
returns public.officer_limits language plpgsql security definer
set search_path = public as $$
declare
  v_old public.officer_limits;
  v_row public.officer_limits;
begin
  perform public.require_role('admin');
  select * into v_old from public.officer_limits where officer_id = p_officer_id;
  insert into public.officer_limits(officer_id, daily_give_limit, max_give_per_player,
                                    can_grant_welcome_bonus)
  values (p_officer_id, p_daily_give_limit, p_max_give_per_player,
          coalesce(p_can_grant_welcome_bonus, true))
  on conflict (officer_id) do update
    set daily_give_limit = excluded.daily_give_limit,
        max_give_per_player = excluded.max_give_per_player,
        can_grant_welcome_bonus = excluded.can_grant_welcome_bonus
  returning * into v_row;
  perform public.write_audit('officer.set_limits', 'officer_limits', p_officer_id,
    to_jsonb(v_old), to_jsonb(v_row));
  return v_row;
end;
$$;

grant execute on function public.record_audit(text, text, uuid, text) to authenticated;
grant execute on function public.admin_set_officer_limits(uuid, bigint, bigint, boolean)
  to authenticated;

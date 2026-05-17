-- Phase 6 — winning rates & number-limit rules.

-- Set the active winning rate for a scope. Deactivates the prior active row,
-- inserts the new one, writes audit.
create or replace function public.set_winning_rate(
  p_game_type text, p_market text, p_round_name text,
  p_winning_rate numeric, p_payout_mode text, p_apply_to text default 'future_rounds')
returns public.payout_settings language plpgsql security definer set search_path = public as $$
declare
  v_admin public.profiles;
  v_row public.payout_settings;
begin
  v_admin := public.require_role('admin');
  if p_game_type not in ('2d','3d')
     or p_payout_mode not in ('multiplier_only','multiplier_plus_stake')
     or p_winning_rate is null or p_winning_rate <= 0 then
    perform public.app_error('invalid_input');
  end if;

  update public.payout_settings set active = false
   where game_type = p_game_type and market = coalesce(p_market,'all')
     and round_name = coalesce(p_round_name,'all') and active = true;

  insert into public.payout_settings(game_type, market, round_name, winning_rate,
                                     payout_mode, apply_to, active, created_by)
  values (p_game_type, coalesce(p_market,'all'), coalesce(p_round_name,'all'),
          p_winning_rate, p_payout_mode, p_apply_to, true, v_admin.id)
  returning * into v_row;

  perform public.write_audit('rate.set', 'payout_settings', v_row.id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

create or replace function public.create_number_limit_rule(
  p_game_type text, p_market text, p_rule_type text,
  p_rule_value jsonb, p_max_points bigint)
returns public.number_limit_rules language plpgsql security definer
set search_path = public as $$
declare
  v_admin public.profiles;
  v_row public.number_limit_rules;
begin
  v_admin := public.require_role('admin');
  if p_rule_type not in ('exact','contains','first_digit','last_digit','range','list','all')
     or p_max_points is null or p_max_points < 0 then
    perform public.app_error('invalid_input');
  end if;
  insert into public.number_limit_rules(game_type, market, rule_type, rule_value,
                                        max_points, active, created_by)
  values (p_game_type, coalesce(p_market,'all'), p_rule_type,
          coalesce(p_rule_value,'{}'::jsonb), p_max_points, true, v_admin.id)
  returning * into v_row;
  perform public.write_audit('number_limit.create', 'number_limit_rules', v_row.id,
    null, to_jsonb(v_row));
  return v_row;
end;
$$;

create or replace function public.update_number_limit_rule(
  p_rule_id uuid, p_max_points bigint default null, p_active boolean default null)
returns public.number_limit_rules language plpgsql security definer
set search_path = public as $$
declare
  v_old public.number_limit_rules;
  v_row public.number_limit_rules;
begin
  perform public.require_role('admin');
  select * into v_old from public.number_limit_rules where id = p_rule_id;
  if v_old.id is null then perform public.app_error('not_found'); end if;
  update public.number_limit_rules
     set max_points = coalesce(p_max_points, max_points),
         active = coalesce(p_active, active)
   where id = p_rule_id
  returning * into v_row;
  perform public.write_audit('number_limit.update', 'number_limit_rules', p_rule_id,
    to_jsonb(v_old), to_jsonb(v_row));
  return v_row;
end;
$$;

-- The matcher. Returns the lowest max_points across every active rule that
-- matches the number, or null if no rule constrains it.
create or replace function public.match_number_limit_rules(
  p_game_type text, p_market text, p_guess_number text, p_round_id uuid default null)
returns bigint language sql stable set search_path = public as $$
  select min(r.max_points)
  from public.number_limit_rules r
  where r.active
    and r.game_type = p_game_type
    and r.market in (p_market, 'all')
    and case r.rule_type
      when 'all'         then true
      when 'exact'       then r.rule_value->>'number' = p_guess_number
      when 'contains'    then position((r.rule_value->>'digit') in p_guess_number) > 0
      when 'first_digit' then left(p_guess_number, 1) = r.rule_value->>'digit'
      when 'last_digit'  then right(p_guess_number, 1) = r.rule_value->>'digit'
      when 'range'       then p_guess_number >= (r.rule_value->>'from')
                              and p_guess_number <= (r.rule_value->>'to')
      when 'list'        then (r.rule_value->'numbers') ? p_guess_number
      else false
    end;
$$;

grant execute on function public.set_winning_rate(text, text, text, numeric, text, text)
  to authenticated;
grant execute on function public.create_number_limit_rule(text, text, text, jsonb, bigint)
  to authenticated;
grant execute on function public.update_number_limit_rule(uuid, bigint, boolean)
  to authenticated;
grant execute on function public.match_number_limit_rules(text, text, text, uuid)
  to authenticated;

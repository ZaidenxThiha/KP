-- Phase 3/5 — account & settings RPCs that complement the auth Edge Functions.

-- Credit the new-player welcome bonus, if enabled. Called by the create-player
-- Edge Function (service role) right after the auth user + profile exist.
-- p_with_bonus lets an officer opt in when game settings allow it.
create or replace function public.apply_new_player_bonus(
  p_player_id uuid, p_with_bonus boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_settings public.game_settings;
  v_player public.profiles;
  v_new_balance bigint;
begin
  select * into v_settings from public.game_settings
   where id = '00000000-0000-0000-0000-000000000001';
  if not v_settings.new_player_bonus_enabled or not p_with_bonus
     or v_settings.new_player_bonus_amount <= 0 then
    return jsonb_build_object('player_id', p_player_id, 'bonus', 0);
  end if;

  select * into v_player from public.profiles where id = p_player_id for update;
  if v_player.id is null or v_player.role <> 'player' then
    perform public.app_error('not_found');
  end if;

  update public.profiles
     set points_balance = points_balance + v_settings.new_player_bonus_amount
   where id = p_player_id
  returning points_balance into v_new_balance;

  insert into public.point_transactions(transaction_type, direction, amount, user_id,
    to_user_id, balance_after, note)
  values ('new_player_bonus', 'credit', v_settings.new_player_bonus_amount, p_player_id,
    p_player_id, v_new_balance, 'welcome bonus');

  perform public.write_audit('player.welcome_bonus', 'profiles', p_player_id, null,
    jsonb_build_object('amount', v_settings.new_player_bonus_amount));
  return jsonb_build_object('player_id', p_player_id,
    'bonus', v_settings.new_player_bonus_amount, 'balance', v_new_balance);
end;
$$;

-- Ensure an officer has an officer_limits row. Called after officer creation.
create or replace function public.ensure_officer_limits(
  p_officer_id uuid, p_daily_give_limit bigint default null,
  p_max_give_per_player bigint default null)
returns public.officer_limits language plpgsql security definer
set search_path = public as $$
declare v_row public.officer_limits;
begin
  insert into public.officer_limits(officer_id, daily_give_limit, max_give_per_player)
  values (p_officer_id, p_daily_give_limit, p_max_give_per_player)
  on conflict (officer_id) do update
    set daily_give_limit = excluded.daily_give_limit,
        max_give_per_player = excluded.max_give_per_player
  returning * into v_row;
  return v_row;
end;
$$;

-- Admin partial update of the singleton game_settings row.
create or replace function public.update_game_settings(p_patch jsonb)
returns public.game_settings language plpgsql security definer
set search_path = public as $$
declare
  v_old public.game_settings;
  v_row public.game_settings;
begin
  perform public.require_role('admin');
  select * into v_old from public.game_settings
   where id = '00000000-0000-0000-0000-000000000001';

  update public.game_settings g set
    free_mode_enabled = coalesce((p_patch->>'free_mode_enabled')::boolean, g.free_mode_enabled),
    new_player_bonus_enabled = coalesce((p_patch->>'new_player_bonus_enabled')::boolean,
      g.new_player_bonus_enabled),
    new_player_bonus_amount = coalesce((p_patch->>'new_player_bonus_amount')::bigint,
      g.new_player_bonus_amount),
    daily_claim_enabled = coalesce((p_patch->>'daily_claim_enabled')::boolean,
      g.daily_claim_enabled),
    daily_claim_amount = coalesce((p_patch->>'daily_claim_amount')::bigint, g.daily_claim_amount),
    auto_settle_enabled = coalesce((p_patch->>'auto_settle_enabled')::boolean,
      g.auto_settle_enabled),
    admin_approval_required = coalesce((p_patch->>'admin_approval_required')::boolean,
      g.admin_approval_required),
    api_result_mode = coalesce(p_patch->>'api_result_mode', g.api_result_mode),
    default_close_before_minutes = coalesce(
      (p_patch->>'default_close_before_minutes')::int, g.default_close_before_minutes),
    rapidapi_calendar_path = coalesce(p_patch->>'rapidapi_calendar_path',
      g.rapidapi_calendar_path),
    rapidapi_calendar_fallback_path = coalesce(p_patch->>'rapidapi_calendar_fallback_path',
      g.rapidapi_calendar_fallback_path),
    rapidapi_results_path = coalesce(p_patch->>'rapidapi_results_path', g.rapidapi_results_path)
  where g.id = '00000000-0000-0000-0000-000000000001'
  returning * into v_row;

  perform public.write_audit('settings.update', 'game_settings', v_row.id,
    to_jsonb(v_old), to_jsonb(v_row));
  return v_row;
end;
$$;

-- Ledger integrity check: sum(credit) - sum(debit) per user must equal balance.
-- Run nightly by cron; returns offending rows (empty = healthy).
create or replace function public.check_ledger_integrity()
returns table(user_id uuid, ledger_balance bigint, profile_balance bigint)
language sql stable set search_path = public as $$
  select p.id,
         coalesce(sum(case when t.direction = 'credit' then t.amount
                           when t.direction = 'debit' then -t.amount else 0 end), 0),
         p.points_balance
  from public.profiles p
  left join public.point_transactions t on t.user_id = p.id
  group by p.id, p.points_balance
  having coalesce(sum(case when t.direction = 'credit' then t.amount
                           when t.direction = 'debit' then -t.amount else 0 end), 0)
         <> p.points_balance;
$$;

grant execute on function public.update_game_settings(jsonb) to authenticated;

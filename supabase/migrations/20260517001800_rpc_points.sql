-- Phase 4 — point ledger RPCs. Admin mints points to officers; officers
-- distribute to players. Every balance change writes its ledger row(s).

-- Admin grants points to an officer. Admin is the mint, so this credits the
-- officer with no matching debit.
create or replace function public.admin_grant_points_to_officer(
  p_officer_id uuid, p_amount bigint, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_admin public.profiles;
  v_officer public.profiles;
  v_new_balance bigint;
begin
  v_admin := public.require_role('admin');
  if p_amount is null or p_amount <= 0 then perform public.app_error('invalid_input'); end if;

  select * into v_officer from public.profiles where id = p_officer_id for update;
  if v_officer.id is null or v_officer.role <> 'officer' then
    perform public.app_error('not_found');
  end if;
  if v_officer.status <> 'active' then perform public.app_error('forbidden'); end if;

  update public.profiles set points_balance = points_balance + p_amount
   where id = p_officer_id
  returning points_balance into v_new_balance;

  insert into public.point_transactions(transaction_type, direction, amount, user_id,
    from_user_id, to_user_id, balance_after, note, created_by)
  values ('admin_grant_to_officer', 'credit', p_amount, p_officer_id,
    v_admin.id, p_officer_id, v_new_balance, p_note, v_admin.id);

  perform public.write_audit('points.admin_grant', 'profiles', p_officer_id, null,
    jsonb_build_object('amount', p_amount, 'balance_after', v_new_balance), p_note);
  return jsonb_build_object('officer_id', p_officer_id, 'balance', v_new_balance);
end;
$$;

-- Sum of points an officer has given out today.
create or replace function public.get_officer_today_given(p_officer_id uuid)
returns bigint language sql stable set search_path = public as $$
  select coalesce(sum(amount), 0)
  from public.point_transactions
  where transaction_type = 'officer_give_points' and direction = 'debit'
    and user_id = p_officer_id and created_at::date = current_date;
$$;

-- Officer gives points to one of their players. Locks both rows, enforces the
-- officer's caps, and writes the two-sided ledger.
create or replace function public.officer_give_points(
  p_player_id uuid, p_amount bigint, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_officer public.profiles;
  v_player public.profiles;
  v_limits public.officer_limits;
  v_today bigint;
  v_officer_balance bigint;
  v_player_balance bigint;
begin
  v_officer := public.require_role('officer');
  if p_amount is null or p_amount <= 0 then perform public.app_error('invalid_input'); end if;

  -- Lock both rows in a stable order (officer then player) to avoid deadlocks.
  select * into v_officer from public.profiles where id = v_officer.id for update;
  select * into v_player from public.profiles where id = p_player_id for update;
  if v_player.id is null or v_player.role <> 'player' then
    perform public.app_error('not_found');
  end if;
  if v_player.assigned_officer_id is distinct from v_officer.id then
    perform public.app_error('forbidden');
  end if;
  if v_player.status <> 'active' then perform public.app_error('forbidden'); end if;

  if v_officer.points_balance < p_amount then
    perform public.app_error('insufficient_balance');
  end if;

  select * into v_limits from public.officer_limits where officer_id = v_officer.id;
  if v_limits.max_give_per_player is not null
     and p_amount > v_limits.max_give_per_player then
    perform public.app_error('per_player_cap_exceeded');
  end if;
  if v_limits.daily_give_limit is not null then
    v_today := public.get_officer_today_given(v_officer.id);
    if v_today + p_amount > v_limits.daily_give_limit then
      perform public.app_error('daily_limit_exceeded',
        jsonb_build_object('remaining', v_limits.daily_give_limit - v_today));
    end if;
  end if;

  update public.profiles set points_balance = points_balance - p_amount
   where id = v_officer.id returning points_balance into v_officer_balance;
  update public.profiles set points_balance = points_balance + p_amount
   where id = v_player.id returning points_balance into v_player_balance;

  -- Credit on the player, debit on the officer — two rows, one give.
  insert into public.point_transactions(transaction_type, direction, amount, user_id,
    from_user_id, to_user_id, balance_after, note, created_by)
  values ('officer_give_points', 'credit', p_amount, v_player.id,
          v_officer.id, v_player.id, v_player_balance, p_note, v_officer.id),
         ('officer_give_points', 'debit', p_amount, v_officer.id,
          v_officer.id, v_player.id, v_officer_balance, p_note, v_officer.id);

  perform public.write_audit('points.officer_give', 'profiles', v_player.id, null,
    jsonb_build_object('amount', p_amount, 'player_balance', v_player_balance), p_note);
  return jsonb_build_object('player_id', v_player.id, 'player_balance', v_player_balance,
    'officer_balance', v_officer_balance);
end;
$$;

grant execute on function public.admin_grant_points_to_officer(uuid, bigint, text)
  to authenticated;
grant execute on function public.get_officer_today_given(uuid) to authenticated;
grant execute on function public.officer_give_points(uuid, bigint, text) to authenticated;

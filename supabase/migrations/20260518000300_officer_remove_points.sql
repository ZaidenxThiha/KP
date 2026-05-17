-- Officers can remove points from their assigned players; the removed points
-- return to the officer's balance.

-- Add the ledger transaction type.
do $$
declare v_con text;
begin
  select conname into v_con from pg_constraint
   where conrelid = 'public.point_transactions'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%transaction_type%';
  if v_con is not null then
    execute format('alter table public.point_transactions drop constraint %I', v_con);
  end if;
end $$;

alter table public.point_transactions
  add constraint point_transactions_transaction_type_check
  check (transaction_type in (
    'admin_grant_to_officer', 'officer_give_points', 'guess_place',
    'win_payout', 'new_player_bonus', 'round_cancel_refund',
    'manual_correction', 'house_win', 'officer_remove_points'));

-- officer_remove_points: take points from an assigned player back to the
-- officer. Locks both rows, writes the two-sided ledger and an audit row.
create or replace function public.officer_remove_points(
  p_player_id uuid, p_amount bigint, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_officer public.profiles;
  v_player public.profiles;
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

  -- A player's balance cannot go negative.
  if v_player.points_balance < p_amount then
    perform public.app_error('insufficient_balance');
  end if;

  update public.profiles set points_balance = points_balance - p_amount
   where id = v_player.id returning points_balance into v_player_balance;
  update public.profiles set points_balance = points_balance + p_amount
   where id = v_officer.id returning points_balance into v_officer_balance;

  -- Debit the player, credit the officer — two rows, one removal.
  insert into public.point_transactions(transaction_type, direction, amount, user_id,
    from_user_id, to_user_id, balance_after, note, created_by)
  values ('officer_remove_points', 'debit', p_amount, v_player.id,
          v_player.id, v_officer.id, v_player_balance, p_note, v_officer.id),
         ('officer_remove_points', 'credit', p_amount, v_officer.id,
          v_player.id, v_officer.id, v_officer_balance, p_note, v_officer.id);

  perform public.write_audit('points.officer_remove', 'profiles', v_player.id, null,
    jsonb_build_object('amount', p_amount, 'player_balance', v_player_balance), p_note);
  return jsonb_build_object('player_id', v_player.id, 'player_balance', v_player_balance,
    'officer_balance', v_officer_balance);
end;
$$;

grant execute on function public.officer_remove_points(uuid, bigint, text) to authenticated;

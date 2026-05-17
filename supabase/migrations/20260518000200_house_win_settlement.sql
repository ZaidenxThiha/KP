-- House revenue: when a round settles, the points staked by losing guesses are
-- credited to the primary admin (the house).

-- 1. Allow a 'house_win' ledger transaction type.
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
    'manual_correction', 'house_win'));

-- 2. settle_round: pay winners, mark losers, and credit the admin with the
--    total losing stakes.
create or replace function public.settle_round(p_round_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_round public.rounds;
  v_guess public.guesses;
  v_won int := 0;
  v_lost int := 0;
  v_paid bigint := 0;
  v_lost_amount bigint := 0;
  v_new_balance bigint;
  v_admin_id uuid;
  v_admin_balance bigint;
begin
  if auth.uid() is not null then perform public.require_role('admin'); end if;
  select * into v_round from public.rounds where id = p_round_id for update;
  if v_round.id is null then perform public.app_error('not_found'); end if;
  if v_round.status <> 'closed' or v_round.final_result_number is null then
    perform public.app_error('conflict', jsonb_build_object('status', v_round.status));
  end if;

  for v_guess in
    select * from public.guesses
     where round_id = p_round_id and status = 'pending'
     order by user_id
     for update
  loop
    if v_guess.guess_number = v_round.final_result_number then
      update public.profiles
         set points_balance = points_balance + v_guess.possible_win_amount
       where id = v_guess.user_id
      returning points_balance into v_new_balance;

      insert into public.point_transactions(transaction_type, direction, amount,
        user_id, to_user_id, balance_after, related_guess_id, related_round_id)
      values ('win_payout', 'credit', v_guess.possible_win_amount, v_guess.user_id,
        v_guess.user_id, v_new_balance, v_guess.id, p_round_id);

      update public.guesses set status = 'won', settled_at = now() where id = v_guess.id;
      v_won := v_won + 1;
      v_paid := v_paid + v_guess.possible_win_amount;
    else
      update public.guesses set status = 'lost', settled_at = now() where id = v_guess.id;
      v_lost := v_lost + 1;
      v_lost_amount := v_lost_amount + v_guess.points_used;
    end if;
  end loop;

  -- Losing stakes are the house's revenue — credit the primary admin.
  if v_lost_amount > 0 then
    select id into v_admin_id from public.profiles
     where role = 'admin' order by created_at limit 1 for update;
    if v_admin_id is not null then
      update public.profiles set points_balance = points_balance + v_lost_amount
       where id = v_admin_id
      returning points_balance into v_admin_balance;

      insert into public.point_transactions(transaction_type, direction, amount,
        user_id, balance_after, related_round_id, note)
      values ('house_win', 'credit', v_lost_amount, v_admin_id, v_admin_balance,
        p_round_id, 'Lost stakes from settled round');
    end if;
  end if;

  update public.rounds set status = 'resulted' where id = p_round_id;
  perform public.write_audit('round.settle', 'rounds', p_round_id, null,
    jsonb_build_object('won', v_won, 'lost', v_lost, 'paid', v_paid,
                       'house_win', v_lost_amount, 'result', v_round.final_result_number));
  return jsonb_build_object('round_id', p_round_id, 'won', v_won, 'lost', v_lost,
    'total_paid', v_paid, 'house_win', v_lost_amount);
end;
$$;

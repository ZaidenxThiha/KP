-- Phase 7 — place_guess: the single most important function in the system.
-- Runs entirely in one transaction so the number-limit check and the balance
-- debit hold their locks together.

create or replace function public.place_guess(
  p_round_id uuid, p_guess_number text, p_points_used bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_player  public.profiles;
  v_round   public.rounds;
  v_payout  public.payout_settings;
  v_max     bigint;
  v_used    bigint;
  v_possible bigint;
  v_guess_id uuid;
  v_new_balance bigint;
begin
  -- 1. authz — active player only
  v_player := public.require_player();

  -- 2. validate points
  if p_points_used is null or p_points_used <= 0 then
    perform public.app_error('invalid_input');
  end if;

  -- 3. load round; check format, status and close time
  select * into v_round from public.rounds where id = p_round_id;
  if v_round.id is null then perform public.app_error('not_found'); end if;
  if (v_round.game_type = '2d' and p_guess_number !~ '^[0-9]{2}$')
     or (v_round.game_type = '3d' and p_guess_number !~ '^[0-9]{3}$') then
    perform public.app_error('invalid_input');
  end if;
  if v_round.status <> 'open' then perform public.app_error('round_not_open'); end if;
  if now() >= v_round.close_time then perform public.app_error('round_closed'); end if;

  -- 4. lock the player's profile row
  select * into v_player from public.profiles where id = v_player.id for update;

  -- 5. balance check
  if v_player.points_balance < p_points_used then
    perform public.app_error('insufficient_balance');
  end if;

  -- 6. active payout settings (most specific scope wins)
  select * into v_payout from public.payout_settings
   where game_type = v_round.game_type and active = true
     and market in (v_round.market, 'all')
     and round_name in (v_round.round_name, 'all')
   order by (market = v_round.market) desc, (round_name = v_round.round_name) desc
   limit 1;
  if v_payout.id is null then perform public.app_error('internal_error'); end if;

  -- Serialise the limit check + insert for this exact (round, number) so two
  -- concurrent guesses cannot both pass the room check. A transaction-scoped
  -- advisory lock is released automatically at COMMIT/ROLLBACK.
  perform pg_advisory_xact_lock(
    hashtextextended(p_round_id::text || ':' || p_guess_number, 0));

  -- 7. number-limit rule
  v_max := public.match_number_limit_rules(
    v_round.game_type, v_round.market, p_guess_number, p_round_id);

  -- 8. sum points already committed to this number
  select coalesce(sum(points_used), 0) into v_used
    from public.guesses
   where round_id = p_round_id and guess_number = p_guess_number
     and status in ('pending', 'won', 'lost');

  -- 9. room check
  if v_max is not null then
    if v_used >= v_max then
      perform public.app_error('number_full', jsonb_build_object('remaining_max', 0));
    elsif v_used + p_points_used > v_max then
      perform public.app_error('partial_room',
        jsonb_build_object('remaining_max', v_max - v_used));
    end if;
  end if;

  -- 10. possible win amount
  v_possible := round(p_points_used * v_payout.winning_rate);
  if v_payout.payout_mode = 'multiplier_plus_stake' then
    v_possible := v_possible + p_points_used;
  end if;

  v_new_balance := v_player.points_balance - p_points_used;

  -- 11. insert the guess with immutable snapshots
  insert into public.guesses(round_id, user_id, game_type, guess_number, points_used,
    winning_rate_snapshot, payout_mode_snapshot, possible_win_amount, status)
  values (p_round_id, v_player.id, v_round.game_type, p_guess_number, p_points_used,
    v_payout.winning_rate, v_payout.payout_mode, v_possible, 'pending')
  returning id into v_guess_id;

  -- 12. debit the balance
  update public.profiles set points_balance = v_new_balance where id = v_player.id;

  -- 13. ledger row
  insert into public.point_transactions(transaction_type, direction, amount, user_id,
    from_user_id, balance_after, related_guess_id, related_round_id)
  values ('guess_place', 'debit', p_points_used, v_player.id, v_player.id,
    v_new_balance, v_guess_id, p_round_id);

  return jsonb_build_object(
    'guess_id', v_guess_id,
    'winning_rate_snapshot', v_payout.winning_rate,
    'possible_win_amount', v_possible,
    'remaining_balance', v_new_balance);
end;
$$;

grant execute on function public.place_guess(uuid, text, bigint) to authenticated;

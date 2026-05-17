-- Phase 9 — settlement RPCs. Payouts always read the guess snapshots, never
-- current payout_settings.

-- Admin records a manual result for a round.
create or replace function public.enter_manual_result(
  p_round_id uuid, p_result_number text, p_note text default null)
returns public.rounds language plpgsql security definer set search_path = public as $$
declare
  v_old public.rounds;
  v_round public.rounds;
begin
  perform public.require_role('admin');
  select * into v_old from public.rounds where id = p_round_id;
  if v_old.id is null then perform public.app_error('not_found'); end if;
  if v_old.status = 'resulted' then perform public.app_error('conflict'); end if;
  if (v_old.game_type = '2d' and p_result_number !~ '^[0-9]{2}$')
     or (v_old.game_type = '3d' and p_result_number !~ '^[0-9]{3}$') then
    perform public.app_error('invalid_input');
  end if;

  update public.rounds
     set manual_result_number = p_result_number, result_source = 'manual_override'
   where id = p_round_id
  returning * into v_round;
  perform public.write_audit('round.manual_result', 'rounds', p_round_id,
    to_jsonb(v_old), to_jsonb(v_round), p_note);
  return v_round;
end;
$$;

-- Pick the final result and ensure the round is closed (betting stopped).
-- Callable by an admin, or by the auto-settle Edge Function (service role).
create or replace function public.approve_settlement(p_round_id uuid)
returns public.rounds language plpgsql security definer set search_path = public as $$
declare
  v_round public.rounds;
  v_final text;
begin
  if auth.uid() is not null then perform public.require_role('admin'); end if;
  select * into v_round from public.rounds where id = p_round_id for update;
  if v_round.id is null then perform public.app_error('not_found'); end if;
  if v_round.status not in ('open', 'closed') then
    perform public.app_error('conflict', jsonb_build_object('status', v_round.status));
  end if;

  v_final := coalesce(v_round.final_result_number,
                      v_round.manual_result_number, v_round.api_result_number);
  if v_final is null then
    perform public.app_error('conflict', jsonb_build_object('reason', 'no_result_available'));
  end if;

  update public.rounds
     set status = 'closed', final_result_number = v_final,
         result_source = coalesce(result_source,
           case when v_round.manual_result_number is not null
                then 'manual_override' else 'api' end)
   where id = p_round_id
  returning * into v_round;
  perform public.write_audit('round.approve_settlement', 'rounds', p_round_id,
    null, jsonb_build_object('final_result_number', v_final));
  return v_round;
end;
$$;

-- Settle every pending guess for a closed round. Idempotent-ish: only acts on
-- a round at status 'closed' with a final result.
create or replace function public.settle_round(p_round_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_round public.rounds;
  v_guess public.guesses;
  v_won int := 0;
  v_lost int := 0;
  v_paid bigint := 0;
  v_new_balance bigint;
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
    end if;
  end loop;

  update public.rounds set status = 'resulted' where id = p_round_id;
  perform public.write_audit('round.settle', 'rounds', p_round_id, null,
    jsonb_build_object('won', v_won, 'lost', v_lost, 'paid', v_paid,
                       'result', v_round.final_result_number));
  return jsonb_build_object('round_id', p_round_id, 'won', v_won,
    'lost', v_lost, 'total_paid', v_paid);
end;
$$;

-- Cancel a round and refund every pending guess.
create or replace function public.cancel_round_and_refund(p_round_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_round public.rounds;
  v_guess public.guesses;
  v_refunded int := 0;
  v_amount bigint := 0;
  v_new_balance bigint;
begin
  perform public.require_role('admin');
  select * into v_round from public.rounds where id = p_round_id for update;
  if v_round.id is null then perform public.app_error('not_found'); end if;
  if v_round.status in ('resulted', 'cancelled') then
    perform public.app_error('conflict', jsonb_build_object('status', v_round.status));
  end if;

  for v_guess in
    select * from public.guesses
     where round_id = p_round_id and status = 'pending'
     order by user_id for update
  loop
    update public.profiles
       set points_balance = points_balance + v_guess.points_used
     where id = v_guess.user_id
    returning points_balance into v_new_balance;

    insert into public.point_transactions(transaction_type, direction, amount,
      user_id, to_user_id, balance_after, related_guess_id, related_round_id, note)
    values ('round_cancel_refund', 'credit', v_guess.points_used, v_guess.user_id,
      v_guess.user_id, v_new_balance, v_guess.id, p_round_id, p_reason);

    update public.guesses set status = 'refunded', settled_at = now()
     where id = v_guess.id;
    v_refunded := v_refunded + 1;
    v_amount := v_amount + v_guess.points_used;
  end loop;

  update public.rounds set status = 'cancelled' where id = p_round_id;
  perform public.write_audit('round.cancel', 'rounds', p_round_id, null,
    jsonb_build_object('reason', p_reason, 'refunded', v_refunded, 'amount', v_amount));
  return jsonb_build_object('round_id', p_round_id, 'refunded', v_refunded,
    'total_refunded', v_amount);
end;
$$;

grant execute on function public.enter_manual_result(uuid, text, text) to authenticated;
grant execute on function public.approve_settlement(uuid) to authenticated;
grant execute on function public.settle_round(uuid) to authenticated;
grant execute on function public.cancel_round_and_refund(uuid, text) to authenticated;

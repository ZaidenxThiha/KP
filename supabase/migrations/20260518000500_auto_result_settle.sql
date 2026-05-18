-- Auto results + auto-settle. Two admin toggles, each independently wired into
-- the scheduled auto-settle Edge Function (run_auto_settlement, every 5m):
--   * api_result_mode = 'api'  -> round results are filled from the live API.
--   * auto_settle_enabled      -> rounds are approved & settled automatically.
-- create-or-replace keeps the existing privileges: enter_manual_result stays
-- granted to `authenticated`, run_auto_settlement stays service_role-only.

-- enter_manual_result: a hand-entered result is an explicit admin override, so
-- it now also writes final_result_number. This keeps a manual result
-- authoritative even when auto-result mode has already promoted an API number
-- onto the round.
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
     set manual_result_number = p_result_number,
         final_result_number = p_result_number,
         result_source = 'manual_override'
   where id = p_round_id
  returning * into v_round;
  perform public.write_audit('round.manual_result', 'rounds', p_round_id,
    to_jsonb(v_old), to_jsonb(v_round), p_note);
  return v_round;
end;
$$;

-- run_auto_settlement: two independently-gated steps run by the 5-minute cron.
--   Step A (api_result_mode = 'api'): promote the synced API number onto every
--           closed round that has no result entered yet — via approve_settlement
--           so the change is audited and the round's final result is set.
--   Step B (auto_settle_enabled and not admin_approval_required): settle every
--           closed round that has a result. In manual result mode an API-only
--           number is not treated as a result, so those rounds are left for the
--           admin to enter and approve by hand.
-- Returns the number of rounds settled.
create or replace function public.run_auto_settlement()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_settings public.game_settings;
  v_round public.rounds;
  v_settled integer := 0;
begin
  select * into v_settings from public.game_settings
   where id = '00000000-0000-0000-0000-000000000001';

  -- Step A — auto-set results from the live API.
  if v_settings.api_result_mode = 'api' then
    for v_round in
      select * from public.rounds
       where status = 'closed'
         and final_result_number is null
         and manual_result_number is null
         and api_result_number is not null
    loop
      perform public.approve_settlement(v_round.id);
    end loop;
  end if;

  -- Step B — auto-approve & settle.
  if v_settings.auto_settle_enabled and not v_settings.admin_approval_required then
    for v_round in
      select * from public.rounds
       where status = 'closed'
         and case
               when v_settings.api_result_mode = 'api'
                 then coalesce(final_result_number, manual_result_number,
                               api_result_number)
               else coalesce(final_result_number, manual_result_number)
             end is not null
    loop
      if v_round.final_result_number is null then
        perform public.approve_settlement(v_round.id);
      end if;
      perform public.settle_round(v_round.id);
      v_settled := v_settled + 1;
    end loop;
  end if;

  return v_settled;
end;
$$;

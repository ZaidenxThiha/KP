-- Daily 2D round automation. Four rounds per trading day at the Thai 2D draw
-- times (11:00, 12:01, 15:00, 16:30, Bangkok local). Betting on each round
-- closes 15 minutes before its draw. Idempotent; skips weekends. Invoked once
-- a day by Supabase Cron.
create or replace function public.create_daily_2d_rounds(p_date date default current_date)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_draws text[] := array['11:00', '12:01', '15:00', '16:30'];
  v_draw  text;
  v_close timestamptz;
  v_count integer := 0;
begin
  -- The Thai stock market is closed on weekends (Sun = 0, Sat = 6).
  if extract(dow from p_date) in (0, 6) then
    return 0;
  end if;

  foreach v_draw in array v_draws loop
    -- Skip if this date+draw round already exists (idempotent).
    if exists (
      select 1 from public.rounds
      where game_type = '2d' and round_date = p_date and round_name = v_draw
    ) then
      continue;
    end if;

    -- Betting closes 15 minutes before the draw. The draw time is Bangkok
    -- local; `at time zone` reads the naive timestamp as Bangkok and yields
    -- the correct UTC instant.
    v_close := ((p_date::text || ' ' || v_draw)::timestamp at time zone 'Asia/Bangkok')
               - interval '15 minutes';

    insert into public.rounds (game_type, market, round_name, round_date,
                               open_time, close_time, status)
    values ('2d', 'thai_myanmar', v_draw, p_date, now(), v_close, 'open');
    v_count := v_count + 1;
  end loop;

  if v_count > 0 then
    perform public.write_audit('round.auto_create', 'rounds', null, null,
      jsonb_build_object('date', p_date, 'created', v_count));
  end if;
  return v_count;
end;
$$;

-- Cron and the sync Edge Functions run as service_role.
grant execute on function public.create_daily_2d_rounds(date) to service_role;

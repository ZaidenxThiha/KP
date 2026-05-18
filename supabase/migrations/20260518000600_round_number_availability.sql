-- Per-number availability for the player betting grid. One call returns, for
-- every number in the round's game type, how many points are already committed
-- and the limit that applies (null = unlimited). Powers the grid's fill bars.
-- security definer: it must read all players' guesses + the limit rules, both
-- of which are otherwise hidden from a player by RLS. It only exposes
-- aggregates per number — never another player's identity.
create or replace function public.round_number_availability(p_round_id uuid)
returns table(guess_number text, used bigint, max_points bigint)
language plpgsql stable security definer set search_path = public as $$
declare
  v_round public.rounds;
  v_hi int;
  v_width int;
begin
  select * into v_round from public.rounds where id = p_round_id;
  if v_round.id is null then perform public.app_error('not_found'); end if;

  if v_round.game_type = '3d' then
    v_hi := 999; v_width := 3;
  else
    v_hi := 99; v_width := 2;
  end if;

  return query
  with nums as (
    select lpad(g::text, v_width, '0') as n
    from generate_series(0, v_hi) as g
  ),
  committed as (
    select gx.guess_number as n, sum(gx.points_used)::bigint as used
    from public.guesses gx
    where gx.round_id = p_round_id
      and gx.status in ('pending', 'won', 'lost')
    group by gx.guess_number
  )
  select nums.n,
         coalesce(committed.used, 0)::bigint,
         public.match_number_limit_rules(
           v_round.game_type, v_round.market, nums.n, p_round_id)
  from nums
  left join committed on committed.n = nums.n
  order by nums.n;
end;
$$;

grant execute on function public.round_number_availability(uuid) to authenticated;

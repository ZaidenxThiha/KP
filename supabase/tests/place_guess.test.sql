-- pgTAP test for place_guess(). Run with: supabase test db
begin;
select plan(8);

-- Setup: a player, an active 2d rate, an open round.
insert into auth.users (instance_id, id, email, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000',
        'a0000000-0000-0000-0000-0000000000a1',
        'tp1@players.local',
        '{"username":"TP1","role":"player"}'::jsonb);
update public.profiles set points_balance = 1000 where username = 'TP1';

insert into public.payout_settings (game_type, market, round_name, winning_rate,
                                    payout_mode, active)
values ('2d', 'all', 'all', 80, 'multiplier_only', true)
on conflict do nothing;

insert into public.rounds (id, game_type, market, round_name, round_date,
                           close_time, status)
values ('b0000000-0000-0000-0000-0000000000b1', '2d', 'thai_myanmar', 'pgtap',
        current_date, now() + interval '1 hour', 'open');

-- Act as the player.
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000a1';

-- Happy path.
select lives_ok(
  $$ select public.place_guess('b0000000-0000-0000-0000-0000000000b1', '25', 100) $$,
  'a valid guess succeeds');
select is(
  (select points_balance from public.profiles where username = 'TP1'),
  900::bigint, 'the balance is debited');
select is(
  (select winning_rate_snapshot from public.guesses where guess_number = '25'),
  80.00, 'the winning rate is snapshotted');
select is(
  (select possible_win_amount from public.guesses where guess_number = '25'),
  8000::bigint, 'the possible win is rate x stake');
select is(
  (select count(*) from public.point_transactions
    where transaction_type = 'guess_place'
      and related_round_id = 'b0000000-0000-0000-0000-0000000000b1'),
  1::bigint, 'exactly one ledger row is written');

-- Insufficient balance.
select throws_like(
  $$ select public.place_guess('b0000000-0000-0000-0000-0000000000b1', '25', 100000) $$,
  '%insufficient_balance%', 'rejects a stake above the balance');

-- Wrong digit count for the game type.
select throws_like(
  $$ select public.place_guess('b0000000-0000-0000-0000-0000000000b1', '255', 100) $$,
  '%invalid_input%', 'rejects a 3-digit number on a 2d round');

-- Closed round.
update public.rounds set status = 'closed'
 where id = 'b0000000-0000-0000-0000-0000000000b1';
select throws_like(
  $$ select public.place_guess('b0000000-0000-0000-0000-0000000000b1', '25', 100) $$,
  '%round_not_open%', 'rejects a guess on a closed round');

select * from finish();
rollback;

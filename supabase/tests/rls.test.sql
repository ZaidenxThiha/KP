-- pgTAP RLS test. Confirms players cannot see each other and cannot write
-- balance-touching tables directly. Run with: supabase test db
begin;
select plan(4);

insert into auth.users (instance_id, id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-00000000aa01',
   'rls1@players.local', '{"username":"RLS1","role":"player"}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-00000000aa02',
   'rls2@players.local', '{"username":"RLS2","role":"player"}'::jsonb);

-- Act as the authenticated role with RLS1's identity.
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000aa01';
set local request.jwt.claims = '{"role":"authenticated"}';

-- A player sees only their own profile row.
select is(
  (select count(*) from public.profiles),
  1::bigint, 'a player sees only their own profile');

select is(
  (select username from public.profiles),
  'RLS1', 'and it is their own row');

-- A player cannot insert a guess directly (no INSERT policy).
select throws_ok(
  $$ insert into public.guesses (round_id, user_id, game_type, guess_number,
       points_used, winning_rate_snapshot, payout_mode_snapshot, possible_win_amount)
     values (gen_random_uuid(), gen_random_uuid(), '2d', '25', 100, 80,
             'multiplier_only', 8000) $$,
  '42501', NULL, 'a player cannot INSERT into guesses directly');

-- A player cannot UPDATE their own balance directly (no UPDATE policy).
reset role;
select is(
  (select count(*) from pg_policies
    where tablename = 'profiles' and cmd in ('UPDATE', 'ALL')),
  0::bigint, 'profiles has no UPDATE policy for any client role');

select * from finish();
rollback;

-- Local dev seed. Production starts empty (admin bootstrapped separately).
-- Passwords here are dev-only. Auth users are inserted directly; the
-- on_auth_user_created trigger materialises each profiles row from metadata.

-- 1. Auth users (trigger creates profiles) -----------------------------------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'admin@players.local',
   crypt('admin12345', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"admin","role":"admin","display_name":"Site Admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'officer1@players.local',
   crypt('officer12345', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"officer1","role":"officer","display_name":"Officer One"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'officer2@players.local',
   crypt('officer12345', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"officer2","role":"officer","display_name":"Officer Two"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444',
   'authenticated', 'authenticated', 'p000001@players.local',
   crypt('player12345', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"P000001","role":"player"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555',
   'authenticated', 'authenticated', 'p000002@players.local',
   crypt('player12345', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"P000002","role":"player"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666',
   'authenticated', 'authenticated', 'p000003@players.local',
   crypt('player12345', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"P000003","role":"player"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777',
   'authenticated', 'authenticated', 'p000004@players.local',
   crypt('player12345', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"P000004","role":"player"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888',
   'authenticated', 'authenticated', 'p000005@players.local',
   crypt('player12345', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"P000005","role":"player"}', now(), now());

-- GoTrue scans the token columns as non-null strings — empty, never NULL.
update auth.users set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  email_change = coalesce(email_change, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where email like '%@players.local';

-- 2. Auth identities (required for email/password login) ---------------------
insert into auth.identities (user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at)
select u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', now(), now(), now()
from auth.users u;

-- 3. Wire player -> officer assignments (profiles came from the trigger) ------
update public.profiles p set assigned_officer_id = o.id, created_by = o.id
from public.profiles o
where o.username = 'officer1' and p.username in ('P000001', 'P000002');

update public.profiles p set assigned_officer_id = o.id, created_by = o.id
from public.profiles o
where o.username = 'officer2' and p.username in ('P000003', 'P000004');
-- P000005 stays unassigned.

update public.profiles p set created_by = a.id
from public.profiles a
where a.username = 'admin' and p.role = 'officer';

-- 4. Officer limits ----------------------------------------------------------
insert into public.officer_limits (officer_id, daily_give_limit, max_give_per_player)
select id, 100000, 20000 from public.profiles where role = 'officer';

-- 5. Starting balances + matching ledger rows (keeps integrity check clean) ---
update public.profiles set points_balance = 1000000 where role = 'officer';
insert into public.point_transactions (transaction_type, direction, amount, user_id,
  to_user_id, balance_after, note)
select 'manual_correction', 'credit', 1000000, id, id, 1000000, 'dev seed'
from public.profiles where role = 'officer';

update public.profiles set points_balance = 5000 where role = 'player';
insert into public.point_transactions (transaction_type, direction, amount, user_id,
  to_user_id, balance_after, note)
select 'manual_correction', 'credit', 5000, id, id, 5000, 'dev seed'
from public.profiles where role = 'player';

-- 6. Active winning rates ----------------------------------------------------
insert into public.payout_settings (game_type, market, round_name, winning_rate,
  payout_mode, active)
values
  ('2d', 'all', 'all', 80.00, 'multiplier_only', true),
  ('3d', 'all', 'all', 100.00, 'multiplier_only', true);

-- 7. Number-limit rules — one of each type (2d) ------------------------------
insert into public.number_limit_rules (game_type, market, rule_type, rule_value, max_points)
values
  ('2d', 'all', 'all',         '{}'::jsonb,                              50000),
  ('2d', 'all', 'contains',    '{"digit":"7"}'::jsonb,                    3000),
  ('2d', 'all', 'first_digit', '{"digit":"1"}'::jsonb,                    4000),
  ('2d', 'all', 'last_digit',  '{"digit":"9"}'::jsonb,                    4000),
  ('2d', 'all', 'range',       '{"from":"30","to":"39"}'::jsonb,          3500),
  ('2d', 'all', 'list',        '{"numbers":["11","55","99"]}'::jsonb,     2000),
  ('2d', 'all', 'exact',       '{"number":"22"}'::jsonb,                   500);

-- 8. One open 2D round for today --------------------------------------------
insert into public.rounds (game_type, market, round_name, round_date,
  open_time, close_time, status)
values ('2d', 'thai_myanmar', 'evening', current_date,
  now(), now() + interval '6 hours', 'open');

-- Seeds load-test players P000001..P000300 (idempotent). Run before k6:
--   psql "$DB_URL" -f scripts/seed-load-test-players.sql
-- All share the password player12345. Profiles get a 1,000,000-point balance
-- (plus a matching ledger row so the integrity check stays clean).

insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
  email_change, phone_change, phone_change_token, reauthentication_token)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
       'authenticated', 'authenticated',
       'p' || lpad(g::text, 6, '0') || '@players.local',
       crypt('player12345', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('username', 'P' || lpad(g::text, 6, '0'), 'role', 'player'),
       now(), now(), '', '', '', '', '', '', '', ''
from generate_series(1, 300) g
on conflict do nothing;

insert into auth.identities (user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at)
select u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', now(), now(), now()
from auth.users u
where u.email like 'p0%@players.local'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);

-- Fund every load-test player and write the matching ledger credit.
-- Adds 1,000,000 (never sets an absolute) so the ledger stays consistent even
-- for players that already had a balance. Idempotent: skips anyone already
-- given the load-test credit.
with funded as (
  update public.profiles p set points_balance = points_balance + 1000000
  where role = 'player' and username like 'P0%'
    and not exists (
      select 1 from public.point_transactions t
      where t.user_id = p.id and t.note = 'load-test seed')
  returning id, points_balance
)
insert into public.point_transactions (transaction_type, direction, amount, user_id,
  to_user_id, balance_after, note)
select 'manual_correction', 'credit', 1000000, id, id, points_balance, 'load-test seed'
from funded;

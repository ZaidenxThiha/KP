-- One-off: create the first admin on a fresh production database.
-- Production starts empty (no seed). Run once with the service role:
--   supabase db remote query "$(cat scripts/bootstrap-admin.sql)"
--
-- CHANGE the username and password below before running, then rotate the
-- password after first login. The on_auth_user_created trigger materialises
-- the profiles row (role=admin) from raw_user_meta_data.

do $$
declare
  v_username text := 'admin';                 -- <-- change me
  v_password text := 'CHANGE-ME-bootstrap-admin'; -- <-- change me, then rotate
  v_email    text := 'admin@players.local';    -- <-- keep <username>@players.local
  v_user_id  uuid := gen_random_uuid();
begin
  if exists (select 1 from public.profiles where role = 'admin') then
    raise notice 'An admin already exists — nothing to do.';
    return;
  end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, phone_change, phone_change_token,
    reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated',
    'authenticated', v_email, crypt(v_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', v_username, 'role', 'admin',
                       'display_name', 'Site Admin'),
    now(), now(), '', '', '', '', '', '', '', '');

  insert into auth.identities (user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at)
  values (v_user_id, v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email', now(), now(), now());

  raise notice 'Admin % created. Log in and rotate the password immediately.', v_username;
end;
$$;

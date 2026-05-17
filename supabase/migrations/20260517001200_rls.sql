-- Phase 1/11 — RLS helpers + policy matrix (docs/SECURITY.md).
--
-- All balance-touching writes happen only inside SECURITY DEFINER RPCs, which
-- run as the function owner and bypass RLS. The policies below therefore grant
-- almost no direct INSERT/UPDATE/DELETE to clients — only SELECT visibility,
-- plus admin DML on configuration tables.

-- Helpers run SECURITY DEFINER so reading profiles inside a profiles policy
-- does not recurse through RLS.
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid();
$$;

create or replace function public.auth_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where auth_user_id = auth.uid();
$$;

-- profiles -------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  auth_user_id = auth.uid()
  or public.auth_role() = 'admin'
  or (public.auth_role() = 'officer' and assigned_officer_id = public.current_profile_id())
);

-- rounds ---------------------------------------------------------------------
drop policy if exists rounds_select on public.rounds;
create policy rounds_select on public.rounds for select to authenticated
using (
  public.auth_role() in ('admin', 'officer')
  or status in ('open', 'closed', 'resulted')
);
drop policy if exists rounds_admin_write on public.rounds;
create policy rounds_admin_write on public.rounds for all to authenticated
using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- payout_settings ------------------------------------------------------------
drop policy if exists payout_settings_select on public.payout_settings;
create policy payout_settings_select on public.payout_settings for select to authenticated
using (active = true or public.auth_role() = 'admin');
drop policy if exists payout_settings_admin_write on public.payout_settings;
create policy payout_settings_admin_write on public.payout_settings for all to authenticated
using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- number_limit_rules ---------------------------------------------------------
drop policy if exists nlr_admin_all on public.number_limit_rules;
create policy nlr_admin_all on public.number_limit_rules for all to authenticated
using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- guesses --------------------------------------------------------------------
drop policy if exists guesses_select on public.guesses;
create policy guesses_select on public.guesses for select to authenticated
using (
  user_id = public.current_profile_id()
  or public.auth_role() = 'admin'
  or (public.auth_role() = 'officer'
      and user_id in (select id from public.profiles
                      where assigned_officer_id = public.current_profile_id()))
);

-- point_transactions ---------------------------------------------------------
drop policy if exists pt_select on public.point_transactions;
create policy pt_select on public.point_transactions for select to authenticated
using (
  user_id = public.current_profile_id()
  or public.auth_role() = 'admin'
  or (public.auth_role() = 'officer'
      and (from_user_id = public.current_profile_id()
           or to_user_id = public.current_profile_id()
           or user_id in (select id from public.profiles
                          where assigned_officer_id = public.current_profile_id())))
);

-- officer_limits -------------------------------------------------------------
drop policy if exists officer_limits_select on public.officer_limits;
create policy officer_limits_select on public.officer_limits for select to authenticated
using (officer_id = public.current_profile_id() or public.auth_role() = 'admin');
drop policy if exists officer_limits_admin_write on public.officer_limits;
create policy officer_limits_admin_write on public.officer_limits for all to authenticated
using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- external_draws / api_sync_logs --------------------------------------------
drop policy if exists external_draws_admin_select on public.external_draws;
create policy external_draws_admin_select on public.external_draws for select to authenticated
using (public.auth_role() = 'admin');
drop policy if exists api_sync_logs_admin_select on public.api_sync_logs;
create policy api_sync_logs_admin_select on public.api_sync_logs for select to authenticated
using (public.auth_role() = 'admin');

-- audit_logs -----------------------------------------------------------------
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
using (public.auth_role() = 'admin' or actor_id = public.current_profile_id());
-- INSERT permitted (RPCs run SECURITY DEFINER); no UPDATE/DELETE policy exists,
-- and table-level UPDATE/DELETE is revoked in the audit_logs migration.
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs for insert to authenticated
with check (true);

-- game_settings --------------------------------------------------------------
-- Singleton config row, no secrets. All authenticated may read; admin writes.
drop policy if exists game_settings_select on public.game_settings;
create policy game_settings_select on public.game_settings for select to authenticated
using (true);
drop policy if exists game_settings_admin_write on public.game_settings;
create policy game_settings_admin_write on public.game_settings for all to authenticated
using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

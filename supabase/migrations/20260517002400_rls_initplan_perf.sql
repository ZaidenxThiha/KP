-- RLS initplan optimisation (auth_rls_initplan advisor finding). Wrapping
-- auth.uid() / auth_role() / current_profile_id() in (select ...) lets the
-- planner evaluate them once per query instead of once per row. Policy logic
-- is unchanged — only the call form differs.

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  auth_user_id = (select auth.uid())
  or (select public.auth_role()) = 'admin'
  or ((select public.auth_role()) = 'officer'
      and assigned_officer_id = (select public.current_profile_id()))
);

-- rounds
drop policy if exists rounds_select on public.rounds;
create policy rounds_select on public.rounds for select to authenticated
using (
  (select public.auth_role()) in ('admin', 'officer')
  or status in ('open', 'closed', 'resulted')
);
drop policy if exists rounds_admin_write on public.rounds;
create policy rounds_admin_write on public.rounds for all to authenticated
using ((select public.auth_role()) = 'admin')
with check ((select public.auth_role()) = 'admin');

-- payout_settings
drop policy if exists payout_settings_select on public.payout_settings;
create policy payout_settings_select on public.payout_settings for select to authenticated
using (active = true or (select public.auth_role()) = 'admin');
drop policy if exists payout_settings_admin_write on public.payout_settings;
create policy payout_settings_admin_write on public.payout_settings for all to authenticated
using ((select public.auth_role()) = 'admin')
with check ((select public.auth_role()) = 'admin');

-- number_limit_rules
drop policy if exists nlr_admin_all on public.number_limit_rules;
create policy nlr_admin_all on public.number_limit_rules for all to authenticated
using ((select public.auth_role()) = 'admin')
with check ((select public.auth_role()) = 'admin');

-- guesses
drop policy if exists guesses_select on public.guesses;
create policy guesses_select on public.guesses for select to authenticated
using (
  user_id = (select public.current_profile_id())
  or (select public.auth_role()) = 'admin'
  or ((select public.auth_role()) = 'officer'
      and user_id in (select id from public.profiles
                      where assigned_officer_id = (select public.current_profile_id())))
);

-- point_transactions
drop policy if exists pt_select on public.point_transactions;
create policy pt_select on public.point_transactions for select to authenticated
using (
  user_id = (select public.current_profile_id())
  or (select public.auth_role()) = 'admin'
  or ((select public.auth_role()) = 'officer'
      and (from_user_id = (select public.current_profile_id())
           or to_user_id = (select public.current_profile_id())
           or user_id in (select id from public.profiles
                          where assigned_officer_id = (select public.current_profile_id()))))
);

-- officer_limits
drop policy if exists officer_limits_select on public.officer_limits;
create policy officer_limits_select on public.officer_limits for select to authenticated
using (officer_id = (select public.current_profile_id())
       or (select public.auth_role()) = 'admin');
drop policy if exists officer_limits_admin_write on public.officer_limits;
create policy officer_limits_admin_write on public.officer_limits for all to authenticated
using ((select public.auth_role()) = 'admin')
with check ((select public.auth_role()) = 'admin');

-- external_draws / api_sync_logs
drop policy if exists external_draws_admin_select on public.external_draws;
create policy external_draws_admin_select on public.external_draws for select to authenticated
using ((select public.auth_role()) = 'admin');
drop policy if exists api_sync_logs_admin_select on public.api_sync_logs;
create policy api_sync_logs_admin_select on public.api_sync_logs for select to authenticated
using ((select public.auth_role()) = 'admin');

-- audit_logs (select only — the insert policy was removed in 20260517002300)
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
using ((select public.auth_role()) = 'admin'
       or actor_id = (select public.current_profile_id()));

-- game_settings (the select policy is `using (true)` — no auth call, unchanged)
drop policy if exists game_settings_admin_write on public.game_settings;
create policy game_settings_admin_write on public.game_settings for all to authenticated
using ((select public.auth_role()) = 'admin')
with check ((select public.auth_role()) = 'admin');

-- Advisor hardening — resolves Supabase security advisor findings after the
-- initial schema deploy (5 ERROR security_definer_view, function_search_path,
-- rls_policy_always_true, and the default PUBLIC execute grant on every RPC).

-- 1. Reporting views must run with the caller's RLS, not the owner's
--    (security_definer_view ERROR x5). The admin report routes use the
--    service client, which bypasses RLS anyway, so admin data is unaffected;
--    a non-admin querying these views directly is now RLS-limited.
alter view public.v_admin_dashboard_stats set (security_invoker = true);
alter view public.v_number_exposure      set (security_invoker = true);
alter view public.v_officer_distribution set (security_invoker = true);
alter view public.v_winning_rate_history set (security_invoker = true);
alter view public.v_daily_pnl            set (security_invoker = true);

-- 2. Pin search_path on the two functions that lacked it.
alter function public.set_updated_at() set search_path = public;
alter function public.app_error(text, jsonb) set search_path = public;

-- 3. The audit_logs INSERT policy was WITH CHECK (true) — any authenticated
--    client could POST forged rows to /rest/v1/audit_logs. write_audit() is
--    SECURITY DEFINER and owns the table, so it still inserts; drop the
--    client-facing policy and revoke INSERT so the log stays append-only.
drop policy if exists audit_logs_insert on public.audit_logs;
revoke insert on public.audit_logs from authenticated, anon;

-- 4. CREATE FUNCTION grants EXECUTE to PUBLIC by default — this exposed every
--    SECURITY DEFINER helper (write_audit, apply_new_player_bonus,
--    ensure_officer_limits, close_due_rounds, run_auto_settlement, ...) over
--    /rest/v1/rpc to anon and authenticated. apply_new_player_bonus has no
--    auth check, so that was a live bonus-farming hole. Remove the blanket
--    grant; re-grant deliberately.
revoke execute on all functions in schema public from public, anon;

-- Backend (Edge Functions + service-client route handlers) runs as service_role.
grant execute on all functions in schema public to service_role;

-- RLS policies are evaluated as the authenticated role and call these two
-- helpers, so they must stay executable by authenticated.
grant execute on function public.auth_role()          to authenticated;
grant execute on function public.current_profile_id() to authenticated;

-- Business RPCs keep the explicit `to authenticated` grants from migrations
-- 14-22 (each self-authorises via require_role/require_player). Internal
-- helpers and automation functions are now service_role-only.

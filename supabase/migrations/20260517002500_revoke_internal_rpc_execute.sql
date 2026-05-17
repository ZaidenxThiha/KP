-- Supabase's default privileges grant EXECUTE on new public functions to
-- `authenticated` EXPLICITLY (not only via PUBLIC), so 20260517002300's
-- REVOKE ... FROM PUBLIC left authenticated able to call internal helpers.
-- Most importantly apply_new_player_bonus has no auth check — a signed-in
-- player could still farm welcome bonuses via /rest/v1/rpc. Revoke the
-- internal helper + automation functions from authenticated so they are
-- service_role-only. They are still reachable internally: the business RPCs
-- that call them run SECURITY DEFINER (as the owner), unaffected by this.
-- The 17 business RPCs keep their `authenticated` grant — each self-authorises.
revoke execute on function public.apply_new_player_bonus(uuid, boolean) from authenticated;
revoke execute on function public.ensure_officer_limits(uuid, bigint, bigint) from authenticated;
revoke execute on function public.write_audit(text, text, uuid, jsonb, jsonb, text) from authenticated;
revoke execute on function public.close_due_rounds() from authenticated;
revoke execute on function public.run_auto_settlement() from authenticated;
revoke execute on function public.trim_api_sync_logs() from authenticated;
revoke execute on function public.require_player() from authenticated;
revoke execute on function public.require_role(text) from authenticated;
revoke execute on function public.handle_new_auth_user() from authenticated;

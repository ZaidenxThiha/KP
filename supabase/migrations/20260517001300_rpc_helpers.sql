-- RPC helpers shared by every business function.

-- Raise a structured, catchable error. The message is the API error code;
-- optional jsonb detail (e.g. {"remaining_max":100}) surfaces as PostgREST
-- error `details`.
create or replace function public.app_error(p_code text, p_detail jsonb default null)
returns void language plpgsql as $$
begin
  raise exception '%', p_code
    using errcode = 'P0001', detail = coalesce(p_detail::text, '{}');
end;
$$;

-- Append an audit row. Safe to call from service-role contexts (actor is null).
create or replace function public.write_audit(
  p_action text, p_table text, p_target uuid,
  p_old jsonb default null, p_new jsonb default null, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(actor_id, actor_role, action_type, target_table,
                                target_id, old_value, new_value, note)
  values (public.current_profile_id(), public.auth_role(), p_action, p_table,
          p_target, p_old, p_new, p_note);
end;
$$;

-- Resolve the calling player's profile, enforcing an active player account.
create or replace function public.require_player()
returns public.profiles language plpgsql stable security definer
set search_path = public as $$
declare v public.profiles;
begin
  select * into v from public.profiles where auth_user_id = auth.uid();
  if v.id is null then perform public.app_error('unauthenticated'); end if;
  if v.role <> 'player' then perform public.app_error('forbidden'); end if;
  if v.status <> 'active' then perform public.app_error('forbidden'); end if;
  return v;
end;
$$;

-- Resolve the caller's profile and require a given role.
create or replace function public.require_role(p_role text)
returns public.profiles language plpgsql stable security definer
set search_path = public as $$
declare v public.profiles;
begin
  select * into v from public.profiles where auth_user_id = auth.uid();
  if v.id is null then perform public.app_error('unauthenticated'); end if;
  if v.role <> p_role then perform public.app_error('forbidden'); end if;
  if v.status <> 'active' then perform public.app_error('forbidden'); end if;
  return v;
end;
$$;

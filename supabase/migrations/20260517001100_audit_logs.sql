-- Phase 10 — audit_logs: privileged actions. Append-only.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_role text,
  action_type text not null,
  target_table text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs(action_type, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

-- Append-only at the table level: no caller but service_role / SECURITY DEFINER
-- RPCs may rewrite history.
revoke update, delete on public.audit_logs from authenticated, anon;

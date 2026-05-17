-- Phase 8 — api_sync_logs: every call to RapidAPI, success or failure.
-- Trimmed by a cron after 30 days.

create table if not exists public.api_sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null check (sync_type in ('calendar', 'results', 'rounds')),
  endpoint text,
  response_status int,
  success boolean not null default false,
  rows_affected int,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists api_sync_logs_created_idx
  on public.api_sync_logs(created_at desc);

alter table public.api_sync_logs enable row level security;

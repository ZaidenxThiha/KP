-- Phase 4 — officer_limits: per-officer caps. One row per officer, created with
-- the officer. Null caps mean "no limit".

create table if not exists public.officer_limits (
  officer_id uuid primary key references public.profiles(id) on delete cascade,
  daily_give_limit bigint check (daily_give_limit is null or daily_give_limit >= 0),
  max_give_per_player bigint check (max_give_per_player is null or max_give_per_player >= 0),
  can_grant_welcome_bonus boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists officer_limits_set_updated_at on public.officer_limits;
create trigger officer_limits_set_updated_at
  before update on public.officer_limits
  for each row execute function public.set_updated_at();

alter table public.officer_limits enable row level security;

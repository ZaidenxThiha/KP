-- Phase 5 — game_settings: singleton row. Admin "Settings" page UPDATEs it
-- through update_game_settings(), never directly.

create table if not exists public.game_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid
    check (id = '00000000-0000-0000-0000-000000000001'::uuid),
  free_mode_enabled boolean not null default true,
  new_player_bonus_enabled boolean not null default true,
  new_player_bonus_amount bigint not null default 1000 check (new_player_bonus_amount >= 0),
  daily_claim_enabled boolean not null default false,
  daily_claim_amount bigint not null default 0 check (daily_claim_amount >= 0),
  auto_settle_enabled boolean not null default false,
  admin_approval_required boolean not null default true,
  api_result_mode text not null default 'manual' check (api_result_mode in ('api', 'manual')),
  default_close_before_minutes int not null default 10
    check (default_close_before_minutes >= 0),
  rapidapi_calendar_path text default 'calendar',
  rapidapi_calendar_fallback_path text default 'beta-calendar',
  rapidapi_results_path text default 'live',
  updated_at timestamptz not null default now()
);

drop trigger if exists game_settings_set_updated_at on public.game_settings;
create trigger game_settings_set_updated_at
  before update on public.game_settings
  for each row execute function public.set_updated_at();

-- Materialise the singleton.
insert into public.game_settings (id) values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

alter table public.game_settings enable row level security;

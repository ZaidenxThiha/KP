-- Phase 5 — rounds: one draw of one game type for one market on one date.
-- Lifecycle: scheduled -> open -> closed -> resulted | cancelled
-- (transitions go through transition_round_status(), never a direct UPDATE).

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  game_type text not null check (game_type in ('2d', '3d')),
  market text not null default 'thai_myanmar',
  round_name text not null default 'all',
  round_date date not null,
  open_time timestamptz,
  close_time timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'open', 'closed', 'resulted', 'cancelled')),
  external_draw_ref uuid references public.external_draws(id),
  api_result_number text,
  manual_result_number text,
  final_result_number text,
  result_source text check (result_source in ('api', 'manual_override')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rounds_status_close_time_idx on public.rounds(status, close_time);
create index if not exists rounds_round_date_idx on public.rounds(round_date desc);
create unique index if not exists rounds_external_draw_ref_idx
  on public.rounds(external_draw_ref) where external_draw_ref is not null;

drop trigger if exists rounds_set_updated_at on public.rounds;
create trigger rounds_set_updated_at
  before update on public.rounds
  for each row execute function public.set_updated_at();

alter table public.rounds enable row level security;

-- Phase 8 schema — external_draws: raw cache of every RapidAPI draw row.
-- Created early because rounds.external_draw_ref references it.

create table if not exists public.external_draws (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'thai_lotto_new_api',
  game_type text not null check (game_type in ('2d', '3d')),
  market text not null default 'thai_myanmar',
  draw_date date not null,
  external_draw_id text not null,
  draw_name text,
  result_number text,
  status text not null default 'scheduled' check (status in ('scheduled', 'resulted')),
  raw_payload jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, game_type, market, draw_date, external_draw_id)
);

create index if not exists external_draws_draw_date_idx
  on public.external_draws(draw_date desc);

drop trigger if exists external_draws_set_updated_at on public.external_draws;
create trigger external_draws_set_updated_at
  before update on public.external_draws
  for each row execute function public.set_updated_at();

alter table public.external_draws enable row level security;

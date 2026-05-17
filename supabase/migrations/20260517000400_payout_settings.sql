-- Phase 6 — payout_settings: historical record of every winning-rate change.
-- Only one row per (game_type, market, round_name) is active at a time.

create table if not exists public.payout_settings (
  id uuid primary key default gen_random_uuid(),
  game_type text not null check (game_type in ('2d', '3d')),
  market text not null default 'all',
  round_name text not null default 'all',
  winning_rate numeric(8, 2) not null check (winning_rate > 0),
  payout_mode text not null
    check (payout_mode in ('multiplier_only', 'multiplier_plus_stake')),
  apply_to text not null default 'future_rounds',
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index if not exists payout_settings_active_idx
  on public.payout_settings(game_type, market, round_name) where active = true;

alter table public.payout_settings enable row level security;

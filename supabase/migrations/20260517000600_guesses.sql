-- Phase 7 — guesses: every guess a player submits.
-- The snapshot columns are immutable after insert; settlement reads them and
-- never recomputes from payout_settings.

create table if not exists public.guesses (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id),
  user_id uuid not null references public.profiles(id),
  game_type text not null check (game_type in ('2d', '3d')),
  guess_number text not null,
  points_used bigint not null check (points_used > 0),
  winning_rate_snapshot numeric(8, 2) not null,
  payout_mode_snapshot text not null
    check (payout_mode_snapshot in ('multiplier_only', 'multiplier_plus_stake')),
  possible_win_amount bigint not null,
  status text not null default 'pending'
    check (status in ('pending', 'won', 'lost', 'cancelled', 'refunded')),
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists guesses_round_status_idx on public.guesses(round_id, status);
create index if not exists guesses_round_number_idx on public.guesses(round_id, guess_number);
create index if not exists guesses_user_created_idx
  on public.guesses(user_id, created_at desc);

alter table public.guesses enable row level security;

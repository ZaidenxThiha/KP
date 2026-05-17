-- Phase 4 — point_transactions: append-only ledger. Every balance change must
-- produce exactly one row per affected user. An officer->player give produces
-- TWO rows (credit on player, debit on officer).

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in (
    'admin_grant_to_officer', 'officer_give_points', 'guess_place',
    'win_payout', 'new_player_bonus', 'round_cancel_refund', 'manual_correction')),
  direction text not null check (direction in ('credit', 'debit')),
  amount bigint not null check (amount > 0),
  user_id uuid not null references public.profiles(id),
  from_user_id uuid references public.profiles(id),
  to_user_id uuid references public.profiles(id),
  balance_after bigint not null,
  related_guess_id uuid references public.guesses(id),
  related_round_id uuid references public.rounds(id),
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists pt_user_created_idx
  on public.point_transactions(user_id, created_at desc);
create index if not exists pt_from_created_idx
  on public.point_transactions(from_user_id, created_at desc);
create index if not exists pt_to_created_idx
  on public.point_transactions(to_user_id, created_at desc);
create index if not exists pt_type_idx
  on public.point_transactions(transaction_type, created_at desc);
create index if not exists pt_guess_idx
  on public.point_transactions(related_guess_id) where related_guess_id is not null;

alter table public.point_transactions enable row level security;

-- Append-only: no client caller may ever rewrite history. SECURITY DEFINER RPCs
-- run as the function owner and are unaffected by this revoke.
revoke update, delete on public.point_transactions from authenticated, anon;

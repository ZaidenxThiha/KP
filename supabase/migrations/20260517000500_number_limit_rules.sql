-- Phase 6 — number_limit_rules: the rules engine. rule_value is jsonb so one
-- column supports every rule type. match_number_limit_rules() reads active rules
-- and returns the lowest max_points.
--
-- rule_value shapes by rule_type:
--   exact        { "number": "22" }
--   contains     { "digit": "2" }
--   first_digit  { "digit": "2" }
--   last_digit   { "digit": "2" }
--   range        { "from": "20", "to": "29" }
--   list         { "numbers": ["11","22","33"] }
--   all          {}

create table if not exists public.number_limit_rules (
  id uuid primary key default gen_random_uuid(),
  game_type text not null check (game_type in ('2d', '3d')),
  market text not null default 'all',
  rule_type text not null check (rule_type in
    ('exact', 'contains', 'first_digit', 'last_digit', 'range', 'list', 'all')),
  rule_value jsonb not null default '{}'::jsonb,
  max_points bigint not null check (max_points >= 0),
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nlr_active_game_idx
  on public.number_limit_rules(active, game_type, market);

drop trigger if exists nlr_set_updated_at on public.number_limit_rules;
create trigger nlr_set_updated_at
  before update on public.number_limit_rules
  for each row execute function public.set_updated_at();

alter table public.number_limit_rules enable row level security;

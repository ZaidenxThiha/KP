-- Phase 1 — profiles: identity + role + balance for every user.

create extension if not exists pgcrypto;

-- Shared trigger to keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  username text not null,
  display_name text,
  role text not null check (role in ('admin', 'officer', 'player')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  points_balance bigint not null default 0 check (points_balance >= 0),
  assigned_officer_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_status_idx on public.profiles(role, status);
create index if not exists profiles_assigned_officer_idx
  on public.profiles(assigned_officer_id) where role = 'player';
create unique index if not exists profiles_username_lower_idx
  on public.profiles(lower(username));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- A profiles row is materialised from the metadata passed to auth.admin.createUser.
-- Single insert path (this trigger) — the create-player Edge Function never inserts
-- profiles directly, it only passes user_metadata. Avoids a duplicate-row race.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, username, display_name, role,
                               assigned_officer_id, created_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.email),
    new.raw_user_meta_data->>'display_name',
    coalesce(new.raw_user_meta_data->>'role', 'player'),
    nullif(new.raw_user_meta_data->>'assigned_officer_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'created_by', '')::uuid
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

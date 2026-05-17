# Database

Source of truth for the schema is in `supabase/migrations/`. The SQL definitions for v1 mirror `plan.md` §11. This document explains *why* each table exists, what indexes you need, and how the tables relate.

## Entity-relationship summary

```
auth.users          (Supabase Auth, not ours to modify)
   │
   ▼
profiles ─────────────┬──────────── created_by → profiles (officers reference admin)
   │                  │
   ├─ assigned_officer_id → profiles (player → officer)
   │
   ├─ officer_limits          (one row per officer)
   ├─ guesses                 (one player ↔ many guesses)
   ├─ point_transactions      (one user ↔ many transactions; both sides via from/to)
   └─ audit_logs              (one user ↔ many audit events)

rounds  ──── external_draw_ref → external_draws
   │
   └─ guesses (one round ↔ many guesses)

payout_settings        (history of rate changes; only one active per game_type/market/round)
number_limit_rules     (active rules used by place_guess())
api_sync_logs          (every RapidAPI call)
game_settings          (singleton row; admin toggles)
```

## Tables

### `profiles`

Identity + role + balance for every user. The `auth_user_id` links to `auth.users` (which Supabase manages); everything else is ours.

**Key columns.** `role` ∈ `{admin, officer, player}`, `status` ∈ `{active, disabled}`, `points_balance bigint`, `assigned_officer_id` (null for admin and officer).

**Indexes.**

```sql
create index profiles_role_status_idx on profiles(role, status);
create index profiles_assigned_officer_idx on profiles(assigned_officer_id) where role = 'player';
create unique index profiles_username_lower_idx on profiles(lower(username));
```

### `rounds`

A round is one draw of one game type for one market on one date. The `external_draw_ref` links to the `external_draws` row that originated it (null for manual rounds).

**Lifecycle.** `scheduled → open → closed → resulted | cancelled`. Transitions go through `transition_round_status()`, never direct UPDATE.

**Indexes.**

```sql
create index rounds_status_close_time_idx on rounds(status, close_time);
create index rounds_round_date_idx on rounds(round_date desc);
create unique index rounds_external_draw_ref_idx on rounds(external_draw_ref) where external_draw_ref is not null;
```

### `payout_settings`

Historical record of every winning-rate change. **Only one row per (`game_type`, `market`, `round_name`) is `active = true` at a time** — enforced by a partial unique index plus an RPC that deactivates the prior row before inserting.

**Indexes.**

```sql
create unique index payout_settings_active_idx
  on payout_settings(game_type, market, round_name)
  where active = true;
```

### `guesses`

Every guess a player submits. The snapshot columns (`winning_rate_snapshot`, `payout_mode_snapshot`, `possible_win_amount`) are **immutable** after insert — settlement reads them, never re-computes from `payout_settings`.

**Status.** `pending → won | lost | cancelled | refunded`.

**Indexes.** Critical for performance during settlement and limit checks.

```sql
create index guesses_round_status_idx on guesses(round_id, status);
create index guesses_round_number_idx on guesses(round_id, guess_number);
create index guesses_user_created_idx on guesses(user_id, created_at desc);
```

The `(round_id, guess_number)` index is what `place_guess()` uses to sum existing points on the same number — make sure it's there before launching.

### `point_transactions`

Append-only ledger. Every balance change must produce exactly one row here. We use `from_user_id` and `to_user_id` for transfers (admin→officer, officer→player), and `user_id` as the affected party for one-sided changes (guess_place, win_payout, bonus). `direction` is `credit` or `debit` from the perspective of `user_id`.

**Convention.**

| transaction_type | from_user_id | to_user_id | user_id | direction |
| --- | --- | --- | --- | --- |
| `admin_grant_to_officer` | admin | officer | officer | credit |
| `officer_give_points` | officer | player | player | credit |
| `officer_give_points` | officer | player | officer | debit |
| `guess_place` | player | null | player | debit |
| `win_payout` | null | player | player | credit |
| `new_player_bonus` | null | player | player | credit |
| `round_cancel_refund` | null | player | player | credit |
| `manual_correction` | admin | * | * | * |

Yes — a single officer→player give inserts **two** rows (one credit on player, one debit on officer). This makes the per-user history queries trivial.

**Indexes.**

```sql
create index pt_user_created_idx on point_transactions(user_id, created_at desc);
create index pt_from_created_idx on point_transactions(from_user_id, created_at desc);
create index pt_to_created_idx on point_transactions(to_user_id, created_at desc);
create index pt_type_idx on point_transactions(transaction_type, created_at desc);
create index pt_guess_idx on point_transactions(related_guess_id) where related_guess_id is not null;
```

**Integrity check (run nightly in a cron job).** Sum of all `credit` minus all `debit` per user should equal `profiles.points_balance`. If it doesn't, there's a bug in an RPC that writes one side but not the other.

### `number_limit_rules`

The rules engine. `rule_value` is `jsonb` to support every rule type with one column. The matcher function `match_number_limit_rules()` reads only active rules and returns the lowest `max_points`.

**`rule_value` shapes** (one of):

```json
{ "digit": "2" }                       // contains
{ "number": "22" }                     // exact
{ "from": "20", "to": "29" }           // range
{ "numbers": ["11", "22", "33"] }      // list
{}                                     // for type='all'
```

**Indexes.**

```sql
create index nlr_active_game_idx on number_limit_rules(active, game_type, market);
```

### `officer_limits`

Per-officer caps. One row per officer, created when the officer is created. Null caps mean "no limit" (e.g., the admin trusts this officer).

### `external_draws`

Raw cache of every draw row we pulled from RapidAPI. We keep `raw_payload` so we can re-process if our parsing changes. The unique constraint on `(source, game_type, market, draw_date, external_draw_id)` makes upserts idempotent.

### `api_sync_logs`

Every call to RapidAPI: success or failure, with `response_status` and `error_message`. Used by the admin "API Sync Status" card. Trim with a cron after 30 days.

### `audit_logs`

Privileged actions. `old_value` / `new_value` are jsonb snapshots — useful for "who changed the 2D rate from 80 to 100 yesterday". `action_type` is a free-form string but we keep a catalog in `lib/audit/types.ts`. See `.claude/skills/audit-log/SKILL.md`.

### `game_settings`

Singleton row (enforce with `id = '00000000-0000-0000-0000-000000000001'::uuid` default + check). The admin "Settings" page UPDATEs this row through `update_game_settings()` RPC, never directly.

## Migration discipline

- One concern per migration.
- Filename: `YYYYMMDDHHMMSS_short_description.sql`.
- Forward-only. If you need to undo, add another migration.
- Every migration is idempotent only if it uses `IF NOT EXISTS` / `CREATE OR REPLACE` — prefer that for tables and policies.
- After every migration: `supabase gen types typescript --local > src/lib/supabase/database.types.ts`. Commit the regenerated file.

## Seed data (`supabase/seed.sql`)

For local dev:

- One admin (`admin / admin12345` — change in dev)
- Two officers
- Five players (two assigned to each officer, one unassigned)
- `game_settings` singleton
- One active `payout_settings` row for 2D (80x) and 3D (100x)
- A handful of `number_limit_rules` covering each rule type for testing the matcher

Seed is for dev only. Production starts empty; the first admin is bootstrapped via a one-off SQL script with the service role.

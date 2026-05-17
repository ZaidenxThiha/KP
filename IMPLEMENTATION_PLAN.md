# Implementation Plan

This plan converts `plan.md` Section 17 ("MVP Build Order") into 12 phases with concrete tasks, dependencies, and acceptance criteria. Build phases in order — each one depends on the one before it.

**Estimating convention.** Hours assume one mid-level developer; pad ×1.5 for first-time-with-Supabase, ×2 for solo + design + testing.

Mark phases done by checking the boxes in `IMPLEMENTATION_PLAN.md` and tagging the commit.

---

## Phase 0 — Project skeleton (4–6 h)

**Goal.** A `pnpm dev` that boots an empty Next.js app pointing at a local Supabase, deployable to Vercel.

- [ ] Init Next.js 14 (App Router, TypeScript, Tailwind, ESLint, Prettier)
- [ ] Init `supabase/` directory with `supabase init`
- [ ] `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAPIDAPI_KEY`, `SYNC_SECRET`
- [ ] `src/lib/supabase/{server,client,service}.ts` — three client factories, only `service` uses the service role key and is never imported into a client component
- [ ] CI: GitHub Actions running `pnpm lint && pnpm typecheck && pnpm test && supabase db reset --linked=false`
- [ ] Deploy a "Hello world" to Vercel and link the Supabase project

**Acceptance.** `pnpm dev` shows a page; CI green; Vercel preview deploy works.

---

## Phase 1 — Auth & profiles (6–8 h)

**Goal.** Username + password auth backed by Supabase Auth, with a `profiles` table that carries the role.

- [ ] Migration: `profiles` table (see `docs/DATABASE.md` §11.1)
- [ ] Migration: trigger that creates a `profiles` row on `auth.users` insert
- [ ] RLS: a user can `SELECT` their own profile, nothing else by default
- [ ] Server util `getCurrentProfile()` and `requireRole('admin' | 'officer' | 'player')`
- [ ] Login page (works on mobile + desktop)
- [ ] Logout
- [ ] Middleware: route `/admin/*` and `/officer/*` redirect to login if no session, redirect to `/403` if wrong role

**Acceptance.** You can sign in a test admin and a test player from the seed file; `/admin` is blocked for players; `/officer` is blocked for players.

---

## Phase 2 — Three layouts (8–10 h)

**Goal.** Empty but role-appropriate shells. No business logic yet.

- [ ] `(admin)/admin/layout.tsx` — left sidebar, top stat cards, main content area, desktop-only breakpoints
- [ ] `(officer)/officer/layout.tsx` — same pattern as admin, simpler nav
- [ ] `(player)/layout.tsx` — mobile-first; bottom nav with Home / Guess / Results / History / Profile
- [ ] Placeholder pages for every route listed in `plan.md` §5
- [ ] Theming via Tailwind: a single accent color, dark mode optional v1
- [ ] Header shows username + role + logout

**Acceptance.** A designer/PM can click through every screen the spec mentions and see a labeled placeholder.

---

## Phase 3 — Account creation (6–8 h)

**Goal.** Officers create players; admin creates officers. Auto-generated credentials. Optional welcome bonus.

- [ ] Migration: extend `profiles` with `created_by`, `assigned_officer_id`
- [ ] RPC `admin_create_officer(username text, password text)` (service role; called from Edge Function)
- [ ] RPC `officer_create_player()` — auto-generates `P + 6 digits` username and 6–8 char password, calls `auth.admin.createUser` internally via the Edge Function wrapper, optionally credits welcome bonus, writes audit log
- [ ] Edge Function `create-player` (officer can call, returns the plaintext password **once**)
- [ ] Admin page: "Officers" — list, create modal, disable toggle
- [ ] Officer page: "Create Player" — button → modal showing username + password + copy button + warning that the password will not be shown again
- [ ] RPC `reset_player_password(player_id uuid)` — generates new temp password, writes audit log

**Acceptance.** Admin creates Officer A. Officer A creates Player P000001. The bonus credit (if enabled) appears in `point_transactions` and `profiles.points_balance`. Password is shown once, never readable again.

---

## Phase 4 — Point ledger (8–10 h)

**Goal.** `admin_grant_points_to_officer()` and `officer_give_points()` working with the full transactional pattern.

- [ ] Migration: `point_transactions`, `officer_limits`, `game_settings`
- [ ] RPC `admin_grant_points_to_officer(officer_id uuid, amount bigint, note text)` — wrapped in transaction, `FOR UPDATE` on officer row, writes ledger + audit
- [ ] RPC `officer_give_points(player_id uuid, amount bigint, note text)` — `FOR UPDATE` on officer **and** player, enforces `officer_limits.daily_give_limit` and `max_give_per_player`, writes ledger + audit
- [ ] RPC `get_officer_today_given(officer_id uuid)` — sums `officer_give_points` transactions where `created_at::date = current_date`
- [ ] Admin page: "Officer Distribution" — grant modal, today's grants table
- [ ] Officer page: "Give Points" + "Distribution History"
- [ ] Negative tests: insufficient balance, exceeded daily limit, exceeded per-player cap, inactive officer, inactive player

**Acceptance.** All negative tests fail loudly with clear errors. Two concurrent calls cannot make the officer balance go negative (verify with a small pgTAP test).

---

## Phase 5 — Rounds & game settings (6–8 h)

**Goal.** Manual round creation in the admin UI, status lifecycle, settings page.

- [ ] Migration: `rounds`, `external_draws`, `api_sync_logs`
- [ ] Admin page: "Rounds" — list, create manual round, edit times, cancel
- [ ] Admin page: "Settings" — toggles for free mode, new player bonus, daily claim, auto-settle, admin approval, API result mode; numeric for close-before-minutes
- [ ] Status transitions: `scheduled → open → closed → resulted | cancelled` enforced in an RPC `transition_round_status()` (never updated directly from a route handler)
- [ ] Player home: "Today's Rounds" reads from `rounds` where `round_date = current_date`

**Acceptance.** Admin creates a 2D round for today. Player home shows it. Admin closes it. Status changes propagate.

---

## Phase 6 — Winning rates & number limits (10–12 h)

**Goal.** Admin can configure payout rates and number-limit rules. No guesses yet, just configuration.

- [ ] Migration: `payout_settings`, `number_limit_rules`
- [ ] RPC `set_winning_rate(game_type, market, round_name, winning_rate, payout_mode, apply_to)` — deactivates the prior active rule, inserts new, writes audit
- [ ] RPC `create_number_limit_rule(...)` and `update_number_limit_rule(...)` — both write audit
- [ ] Function `match_number_limit_rules(game_type text, market text, guess_number text, round_id uuid)` returns the lowest `max_points` from all matching rules
- [ ] Admin page: "Winning Rates" — list + edit modal
- [ ] Admin page: "Number Limits" — list + create modal supporting all 7 rule types from `plan.md` §9.1
- [ ] Unit tests on `match_number_limit_rules`: exact > contains > first_digit > last_digit > range > list > all, lowest wins

**Acceptance.** Configure "global 2D max 5000", "includes 2 max 1000", "exact 22 max 500" → calling the matcher for `22` returns 500.

---

## Phase 7 — Guess submission (10–14 h)

**Goal.** The `place_guess` RPC. This is the single most important function in the system.

- [ ] RPC `place_guess(round_id, guess_number, points_used)` — implements every step in `plan.md` §12.1. See `.claude/skills/supabase-rpc/SKILL.md` for the template.
- [ ] Snapshots `winning_rate_snapshot`, `payout_mode_snapshot`, `possible_win_amount` onto the `guesses` row
- [ ] Number-limit check uses `match_number_limit_rules` **inside** the same transaction with a `FOR UPDATE` on the affected `guesses` rows for that number
- [ ] Edge Function or route handler `POST /api/v1/guesses` calls the RPC and translates Postgres exceptions into friendly errors
- [ ] Player page: "Guess" — game type tabs (2D/3D), number input with format validation, points input with available balance and remaining limit shown live
- [ ] Optimistic UI: show pending state immediately, reconcile from Realtime
- [ ] Pessimistic concurrency test: simulate 50 concurrent guesses on a number with limit 1000 × 100 points each — exactly 10 should succeed

**Acceptance.** All 12 validation steps in §12.1 are covered by tests. The concurrency test passes. The rate-change-after-guess test passes (admin changes rate, old guess still uses old snapshot).

---

## Phase 8 — RapidAPI sync (8–10 h)

**Goal.** Scheduled Edge Functions populate `external_draws` and update `rounds`.

- [ ] Edge Function `sync-lotto-calendar` — calls `rapidapi_calendar_path`, falls back to `rapidapi_calendar_fallback_path`, upserts into `external_draws`, logs to `api_sync_logs`
- [ ] Edge Function `sync-lotto-results` — calls live/results endpoints, updates `external_draws.result_number` and `external_draws.status`
- [ ] Edge Function `create-or-update-rounds-from-api` — reads `external_draws`, creates `rounds` rows if missing, links via `external_draw_ref`
- [ ] Supabase cron schedule per `plan.md` §7
- [ ] Settings page: endpoint paths are editable (don't hardcode), API result mode toggle
- [ ] Admin "API Results" page: shows recent `api_sync_logs` and `external_draws`
- [ ] All paths configurable from `game_settings` (the spec is explicit: endpoints can change)

**Acceptance.** Disable internet → sync logs an error, doesn't crash, retries on schedule. Enable internet → calendar shows up in `external_draws` within one cron cycle.

---

## Phase 9 — Settlement (8–10 h)

**Goal.** Admin approves or auto-settle runs. Winners credited. Losers marked. All using snapshots.

- [ ] RPC `enter_manual_result(round_id, result_number, note)` — writes to `rounds.manual_result_number`, `result_source = 'manual_override'`, audit log
- [ ] RPC `approve_settlement(round_id)` — sets `final_result_number` from `api_result_number` or `manual_result_number`, transitions to `closed`
- [ ] RPC `settle_round(round_id)` — iterates pending guesses; for matches, computes payout from `winning_rate_snapshot` and `payout_mode_snapshot` on the guess (never current settings); credits player; writes `win_payout` transaction; marks round `resulted`; writes audit
- [ ] RPC `cancel_round_and_refund(round_id, reason)` — refunds all pending guesses with `round_cancel_refund` transactions
- [ ] Edge Function `auto-settle-rounds` — when `auto_settle_enabled` and `admin_approval_required = false`, calls `settle_round` for closed rounds with a final result
- [ ] Admin page: "Manual Result Override" — enter result, see effect, approve
- [ ] Player results page reflects settlement

**Acceptance.** A round with mixed winners/losers settles correctly. Total points before = total points after (officer pool deducted, player payouts credited, ledger balances). Changing the rate between guess and settlement does not affect the payout.

---

## Phase 10 — Reports & audit UI (6–8 h)

**Goal.** Admin sees the reports listed in `plan.md` §15. Audit log is queryable.

- [ ] Views: `v_admin_dashboard_stats`, `v_number_exposure`, `v_officer_distribution`, `v_winning_rate_history`
- [ ] Admin page: "Dashboard" — all 10 summary cards from §5.1
- [ ] Admin page: "Reports" — number exposure, officer report, winning rate history, daily P/L
- [ ] Admin page: "Audit Logs" — table with filters by actor, action_type, date range
- [ ] CSV export buttons where useful

**Acceptance.** Every metric in §15 appears somewhere. The audit log shows every privileged action taken during testing.

---

## Phase 11 — Security hardening (6–10 h)

**Goal.** RLS audit, secret audit, penetration of obvious holes.

- [ ] RLS policies for every business table; see `docs/SECURITY.md` for the matrix
- [ ] Test: log in as a player → try to read another player's `guesses` → should fail
- [ ] Test: log in as officer → try to read another officer's players → should fail
- [ ] Test: log in as player → try to UPDATE own `points_balance` → should fail
- [ ] `pnpm build` → grep `dist/` and `.next/` for `service_role`, `rapidapi`, `sk_` — must return zero
- [ ] All internal endpoints require `SYNC_SECRET` header or Supabase service role JWT
- [ ] Rate limit on `POST /api/v1/guesses` and `POST /api/v1/officer/points/give` (Upstash or Vercel KV)
- [ ] Add CSP and basic security headers in `next.config.js`

**Acceptance.** A junior dev attempting to call privileged endpoints as a player gets 401/403 every time. No secrets in the client bundle.

---

## Phase 12 — Polish & deploy (4–6 h)

- [ ] Error boundaries on every layout
- [ ] Loading skeletons on slow pages
- [ ] Empty states (no guesses, no rounds today, etc.)
- [ ] Free-mode disclaimer rendered on Home and footer
- [ ] 404 and 403 pages
- [ ] Production env vars set in Vercel and Supabase
- [ ] `supabase db push` to remote
- [ ] Cron schedules enabled on remote
- [ ] Smoke test on prod with throwaway accounts
- [ ] Tag `v1.0.0`

**Acceptance.** A new player from a fresh device can: be created by an officer → log in → see today's rounds → place a guess → see it in history → see the result post-settlement.

---

## Out of scope for v1

Explicitly excluded (per `plan.md` §18):

- Cash payment, top-up, withdrawal
- Referral system
- Group-pool number limits (only per-number in v1)
- Multiple markets with separate UIs (a single "Thai-Myanmar" is enough)
- Auto-settlement without admin approval (build it, but ship with the toggle off)

---

## Tracking

Status column for the project lead to maintain:

| Phase | Status | Owner | Started | Done |
| --- | --- | --- | --- | --- |
| 0  Skeleton | ⬜ |  |  |  |
| 1  Auth & profiles | ⬜ |  |  |  |
| 2  Layouts | ⬜ |  |  |  |
| 3  Account creation | ⬜ |  |  |  |
| 4  Point ledger | ⬜ |  |  |  |
| 5  Rounds & settings | ⬜ |  |  |  |
| 6  Rates & limits | ⬜ |  |  |  |
| 7  Guess submission | ⬜ |  |  |  |
| 8  RapidAPI sync | ⬜ |  |  |  |
| 9  Settlement | ⬜ |  |  |  |
| 10 Reports & audit | ⬜ |  |  |  |
| 11 Security hardening | ⬜ |  |  |  |
| 12 Polish & deploy | ⬜ |  |  |  |

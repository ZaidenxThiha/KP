# Architecture

## System overview

```
┌─────────────────────┐      ┌───────────────────────────────────────┐
│  Browser (Next.js)  │      │  Vercel (Next.js Server)              │
│                     │──────▶  - Server Components                  │
│  - Player (mobile)  │      │  - Route Handlers (/api/v1/*)         │
│  - Officer/Admin    │◀─────│  - Middleware (auth + role guards)    │
│    (desktop)        │      └────────────────┬──────────────────────┘
└─────────────────────┘                       │
       │ (anon key only)                      │ (service role key, server-only)
       ▼                                      ▼
┌───────────────────────────────────────────────────────────────────┐
│                            Supabase                               │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────────────┐ │
│  │   Auth     │  │  Postgres  │  │  Edge Functions (Deno)       │ │
│  │            │  │  + RLS     │  │  - sync-lotto-calendar       │ │
│  │ users      │  │  + RPCs    │  │  - sync-lotto-results        │ │
│  └────────────┘  │  + Realtime│  │  - create-player             │ │
│                  └──────┬─────┘  │  - settle-round              │ │
│                         │        └────────────┬─────────────────┘ │
│                         │                     │                   │
│              ┌──────────▼────────┐            │                   │
│              │  Supabase Cron    │────────────┘                   │
│              └───────────────────┘                                │
└─────────────────────────────────────────────────────────────────┬─┘
                                                                  │ (RAPIDAPI_KEY,
                                                                  │  Edge Fn secret)
                                                                  ▼
                                            ┌────────────────────────────────────┐
                                            │  thai-lotto-new-api.p.rapidapi.com │
                                            └────────────────────────────────────┘
```

## Separation of concerns

| Layer | Responsibility | Forbidden |
| --- | --- | --- |
| Browser | Render, capture input, call own server | Calling Supabase with service role; calling RapidAPI |
| Next.js server | Auth gate, validate input, invoke RPCs/Edge Functions, render | Direct table writes for balances/results/rates |
| Postgres RPC | All transactional business logic — guesses, point movements, settlement | Anything not in a transaction |
| Edge Functions | RapidAPI calls, scheduled jobs, password generation | Being callable by anon clients |
| Supabase Auth | Identity, password hashing | Knowing the player's role (that's in `profiles`) |
| RapidAPI | Source of truth for draw schedule and results | Being called from the client |

## Data flow: a guess

```
1. Player taps "Submit"
2. Browser POSTs to /api/v1/guesses (Next.js route handler)
3. Route handler:
   a. validates the session cookie (Supabase Auth)
   b. validates body with zod
   c. calls supabase.rpc('place_guess', {...})
4. Postgres place_guess() runs in a transaction:
   a. SELECT FOR UPDATE on the player's profile row
   b. checks round status & close_time
   c. matches number_limit_rules, locks affected guesses rows
   d. reads payout_settings active row
   e. inserts into guesses with snapshot columns
   f. UPDATE profiles SET points_balance = points_balance - ...
   g. INSERT into point_transactions
   h. INSERT into audit_logs (optional for player actions, required for admin/officer)
   i. COMMIT
5. Route handler returns the guess id
6. Realtime channel pushes the new guess to the player's history page
```

## Data flow: a result

```
1. Supabase Cron fires (e.g., at 11:55)
2. sync-lotto-results Edge Function:
   a. fetches RAPIDAPI_KEY from secret store
   b. GETs the live endpoint
   c. upserts into external_draws
   d. for each draw with result_number != null, UPDATE the matched rounds row's api_result_number
3. Admin clicks "Approve" (or auto-settle cron runs)
4. approve_settlement() sets final_result_number, transitions round to closed
5. settle_round() in a transaction:
   a. iterates pending guesses for the round
   b. for matches: status='won', payout from winning_rate_snapshot * points_used (or + stake if multiplier_plus_stake)
   c. for non-matches: status='lost'
   d. credits winners' balances + ledger rows
   e. marks round 'resulted'
   f. audit log
```

## Tech rationale

- **Why Supabase over a custom backend.** Auth + DB + serverless + realtime + cron in one platform, free tier handles 200 players easily, RLS gives us in-database authorization which complements but doesn't depend on application code.
- **Why RPCs over route-handler logic.** Concurrency. The number-limit check and the balance deduction must happen with row locks held; that only works inside a single Postgres transaction. Route handlers spread the same work across multiple round-trips and can't take row locks.
- **Why snapshot rates.** Admin can change the 2D rate from 80x to 100x at any time. Without snapshots, a guess placed at 80x could pay out at 100x, which the admin can't reason about. With snapshots, the player's screen says "this will pay 8,000 if it wins" and that's exactly what they get.
- **Why server-only RapidAPI.** The RapidAPI key is rate-limited and metered. Exposing it lets anyone burn the quota. Also, the spec changes endpoints between calendar and beta-calendar — keeping the path in `game_settings` instead of hardcoding it lets the admin flip without a deploy.

## Environments

| Env | URL | DB | Purpose |
| --- | --- | --- | --- |
| Local | `http://localhost:3000` | `supabase start` (Docker) | Dev |
| Preview | Vercel preview per PR | Supabase preview branch | PR review |
| Production | the real domain | Supabase prod project | Players |

Preview branches are a Supabase Pro feature. On free tier, point preview deploys at a shared staging project.

## Realtime channels

| Channel | Subscribed by | Used for |
| --- | --- | --- |
| `guesses:user_id=eq.{me}` | Player | Live update of own guess status |
| `rounds:round_date=eq.today` | Everyone | Round status changes |
| `point_transactions:user_id=eq.{me}` | Player | Live balance updates |
| `point_transactions:from_user_id=eq.{me}` | Officer | Live distribution history |

Realtime is wired *after* RLS, not as a bypass — channels still respect RLS.

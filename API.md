# API Reference

All endpoints are Next.js route handlers under `src/app/api/v1/`. Internal endpoints additionally require `x-sync-secret: $SYNC_SECRET`.

All bodies validated with `zod` schemas living in `src/lib/validation/`. The schemas are the source of truth — this doc is a summary.

## Auth model

| Endpoint group | Required session | Role check |
| --- | --- | --- |
| `/api/v1/auth/*` | none | none |
| `/api/v1/player/*` | yes | `player` |
| `/api/v1/guesses` | yes | `player` |
| `/api/v1/officer/*` | yes | `officer` |
| `/api/v1/admin/*` | yes | `admin` |
| `/api/v1/internal/*` | optional | `SYNC_SECRET` header |
| `/api/v1/calendar`, `/api/v1/rounds/today`, `/api/v1/results/today` | optional | public read of cached data |

## Player endpoints

### `POST /api/v1/guesses`

Place a guess.

Body:

```json
{
  "round_id": "uuid",
  "guess_number": "25",
  "points_used": 100
}
```

Response 200:

```json
{
  "guess_id": "uuid",
  "winning_rate_snapshot": 80.00,
  "possible_win_amount": 8000,
  "remaining_balance": 4900
}
```

Errors:

- `400 invalid_input` — bad number format or non-positive points
- `403 round_closed` — past `close_time` or status not `open`
- `403 insufficient_balance`
- `403 number_full` — number-limit hit; response includes `{ remaining_max: 0 }`
- `403 partial_room` — only some points fit; response includes `{ remaining_max: 100 }`

### `GET /api/v1/player/balance`

Returns `{ balance: number, updated_at: iso8601 }`.

### `GET /api/v1/player/history?game_type=2d&page=1&page_size=20`

Paginated own guesses.

### `GET /api/v1/rounds/today`

Cached list of today's rounds with their winning rates (current — for display) and close times. Players use this to populate the home screen.

### `GET /api/v1/results/today`

Cached final results for rounds that have settled today.

### `GET /api/v1/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD`

Cached calendar from `external_draws`. **Does not call RapidAPI.**

## Officer endpoints

### `POST /api/v1/officer/players/create`

Body: `{ welcome_bonus?: boolean }` (officer can opt in if admin allows).

Response 200:

```json
{
  "player_id": "uuid",
  "username": "P483921",
  "password": "K7M9Q2",
  "balance": 1000
}
```

**Important.** The plaintext `password` is in the response **only this once**. UI shows it with a copy button and a "you will not see this again" warning.

### `POST /api/v1/officer/players/reset-password`

Body: `{ player_id: uuid }`. Response includes the new temp password (shown once).

### `POST /api/v1/officer/points/give`

Body: `{ player_id: uuid, amount: number, note?: string }`.

Errors include `403 daily_limit_exceeded`, `403 per_player_cap_exceeded`, `403 insufficient_balance`.

### `GET /api/v1/officer/players`

Returns the officer's assigned players with current balances.

### `GET /api/v1/officer/distribution-history?date=YYYY-MM-DD`

## Admin endpoints

### `POST /api/v1/admin/officers/create`

Body: `{ username: string, password: string }` (admin chooses; not auto-generated for officers).

### `POST /api/v1/admin/officers/grant-points`

Body: `{ officer_id: uuid, amount: number, note?: string }`.

### `POST /api/v1/admin/officers/{officer_id}/limits`

Body matches `officer_limits` columns. Upserts the row.

### `POST /api/v1/admin/winning-rates`

Body:

```json
{
  "game_type": "2d",
  "market": "all",
  "round_name": "all",
  "winning_rate": 80.0,
  "payout_mode": "multiplier_only",
  "apply_to": "future_rounds"
}
```

Deactivates the prior active rule for the same scope, inserts the new one, writes audit.

### `POST /api/v1/admin/number-limits`

Body matches `number_limit_rules` columns.

### `POST /api/v1/admin/rounds/override-result`

Body: `{ round_id: uuid, result_number: string, note?: string }`.

### `POST /api/v1/admin/rounds/approve-settlement`

Body: `{ round_id: uuid }`. Triggers `approve_settlement()` then `settle_round()` if auto-approval is on; otherwise leaves the round at `closed` for admin to manually settle.

### `POST /api/v1/admin/rounds/cancel`

Body: `{ round_id: uuid, reason: string }`. Calls `cancel_round_and_refund()`.

### `POST /api/v1/admin/settings`

Body matches `game_settings` columns (partial update).

### `GET /api/v1/admin/reports/{report_name}`

`report_name` ∈ `dashboard | number_exposure | officer_distribution | winning_rate_history | daily_pnl`. Returns CSV if `Accept: text/csv`, JSON otherwise.

### `GET /api/v1/admin/audit-logs?actor=uuid&action_type=...&from=...&to=...&page=1`

## Internal endpoints

Require `x-sync-secret: $SYNC_SECRET`. Called by Supabase Cron or manual operator scripts.

### `POST /api/v1/internal/sync-lotto-calendar`

Triggers the `sync-lotto-calendar` Edge Function.

### `POST /api/v1/internal/sync-lotto-results`

Triggers `sync-lotto-results`.

### `POST /api/v1/internal/auto-close-rounds`

Closes any round where `now() >= close_time`.

### `POST /api/v1/internal/auto-settle-rounds`

For rounds at status `closed` with a `final_result_number`, when `auto_settle_enabled = true`.

## Error format

All errors share:

```json
{
  "error": {
    "code": "snake_case_string",
    "message": "Human-readable",
    "details": { /* optional, schema validation errors etc. */ }
  }
}
```

Codes used:

`invalid_input` `unauthenticated` `forbidden` `round_closed` `round_not_open` `insufficient_balance` `number_full` `partial_room` `daily_limit_exceeded` `per_player_cap_exceeded` `rate_limited` `not_found` `conflict` `internal_error`

## Rate limits

See `docs/SECURITY.md` "Rate limits". When limited, the response is `429 rate_limited` with a `Retry-After` header.

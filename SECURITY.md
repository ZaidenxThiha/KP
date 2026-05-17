# Security

## Threat model

| Actor | Goal | Defense |
| --- | --- | --- |
| Curious player | See another player's guesses or balance | RLS scoped to `user_id = auth.uid()` |
| Hostile player | Submit a guess after `close_time`, or with negative points | `place_guess` RPC validates round status + amount > 0 |
| Hostile player | Submit two guesses concurrently to bypass a number limit | RPC takes row locks inside a single transaction |
| Hostile player | Forge a winning rate | Snapshot at insert; settlement reads snapshot, not current setting |
| Hostile player | Call RapidAPI directly with the project's key | Key only in Edge Function secrets; never reaches the browser |
| Compromised officer | Mint unlimited points | Officer balance is decremented atomically; no RPC inserts credit without a matching debit |
| Compromised officer | Reset a player's password and steal points | Reset is logged; admin sees it; balance still requires another officer→player transfer with the new password |
| Compromised admin | Cover tracks | `audit_logs` is append-only via RLS (no DELETE policy); table-level revoke on UPDATE/DELETE for non-service roles |
| Network attacker | MITM the API call | HTTPS everywhere; Supabase + Vercel are TLS by default |
| Anyone | Replay an internal cron call | Internal endpoints require `SYNC_SECRET` header **and** check `x-vercel-cron` or originate from a Supabase Edge Function |

## RLS policy matrix

| Table | role: player | role: officer | role: admin | service_role |
| --- | --- | --- | --- | --- |
| `profiles` | SELECT own row | SELECT own + assigned players | SELECT all | full |
| `rounds` | SELECT all where `status` ∈ open/closed/resulted | SELECT all | full | full |
| `payout_settings` | SELECT where active | SELECT where active | full | full |
| `number_limit_rules` | none | none | full | full |
| `guesses` | SELECT own; INSERT only via RPC | SELECT own players' | SELECT all | full |
| `point_transactions` | SELECT own | SELECT where from/to_user_id = own players' | SELECT all | full |
| `officer_limits` | none | SELECT own | full | full |
| `external_draws` | none | none | SELECT all | full |
| `api_sync_logs` | none | none | SELECT all | full |
| `audit_logs` | none | SELECT where actor = self | SELECT all; no UPDATE/DELETE | INSERT only |
| `game_settings` | SELECT free_mode_enabled, new_player_bonus_*, default_close_before_minutes | same | full | full |

"full" means SELECT + INSERT + UPDATE + DELETE. "none" means the policy doesn't permit access at all from that role.

**Important.** *Nothing* in the matrix permits direct INSERT or UPDATE on tables that touch balances (`profiles.points_balance`, `guesses`, `point_transactions`). Those happen only inside `SECURITY DEFINER` RPCs whose function-level GRANT controls who can call them. See `.claude/skills/supabase-rls/SKILL.md` for the full pattern.

## Secrets

| Secret | Lives in | Touches the browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel env + client bundle | yes (safe, public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env + client bundle | yes (safe, intended) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (server only) + Supabase secret | **no — ever** |
| `RAPIDAPI_KEY` | Supabase Edge Function secret | **no — ever** |
| `SYNC_SECRET` | Vercel env (server only) + Supabase secret | **no — ever** |
| Player passwords | shown once at creation; not stored in plaintext | shown once |

**Verification step.** After every prod build:

```bash
pnpm build
grep -rE '(service_role|RAPIDAPI_KEY|SYNC_SECRET)' .next/ || echo "OK: no secrets in client bundle"
```

If grep finds anything, **do not deploy**. Most likely a server-only util got imported into a client component.

## Auth flow

```
1. Officer creates player via Edge Function (uses service role)
   → Edge Function calls supabase.auth.admin.createUser({ email: synthetic, password })
   → Edge Function inserts profiles row with role='player'
   → Returns plaintext password to officer ONCE; not stored anywhere

2. Player logs in via Supabase Auth (anon key, password grant)
   → Receives session cookie

3. Browser includes cookie on every request to Next.js
4. Next.js middleware:
   → Reads cookie, validates session with Supabase
   → Looks up profile.role
   → Allows / denies / redirects based on the route's required role
```

Synthetic emails (we don't ask for real emails): `<username>@players.local` works — Supabase doesn't validate deliverability.

## Rate limits

Per IP and per user, whichever is lower:

| Endpoint | Limit | Why |
| --- | --- | --- |
| `POST /api/v1/guesses` | 60 / min / user | Stop spam/abuse; one guess takes a few seconds anyway |
| `POST /api/v1/officer/points/give` | 30 / min / officer | Sanity check |
| `POST /api/v1/admin/*` | 120 / min / admin | Admins click around faster |
| `POST /api/v1/internal/*` | none, but requires `SYNC_SECRET` | Server-to-server |

Implementation: Upstash Ratelimit or Vercel KV in middleware.

## RLS testing checklist

For Phase 11 sign-off, run these from `psql` as each role:

```sql
-- as anon
select count(*) from profiles;           -- expect 0
select count(*) from guesses;            -- expect 0

-- as player A
select count(*) from guesses;            -- expect only A's
select count(*) from profiles;           -- expect only A's profile
update profiles set points_balance = 9999999 where id = auth.uid();
-- expect: 0 rows updated (no UPDATE policy for player on profiles)
insert into guesses (...) values (...);  -- expect: RLS violation

-- as officer
select count(*) from guesses;            -- expect only assigned players'

-- as admin
select count(*) from guesses;            -- expect all
delete from audit_logs limit 1;          -- expect: no DELETE policy → error
```

## Append-only enforcement

`audit_logs` and `point_transactions` should be append-only. Enforce at the policy layer:

```sql
-- audit_logs: only INSERT, no UPDATE/DELETE for anyone except service_role
alter table audit_logs enable row level security;
create policy audit_logs_insert_authenticated on audit_logs
  for insert to authenticated with check (true);
-- No UPDATE or DELETE policies. Anyone but service_role gets 0 rows affected.
revoke update, delete on audit_logs from authenticated;

-- Same for point_transactions
revoke update, delete on point_transactions from authenticated;
```

The RPC functions run as `SECURITY DEFINER` (i.e., as the function owner, not the caller), so they can still INSERT — but no client-side caller can ever UPDATE or DELETE.

## Incident response

If you suspect a balance bug:

1. **Freeze writes.** Toggle `game_settings.free_mode_enabled = false` (we'll co-opt this flag to mean "maintenance"). Or temporarily revoke EXECUTE on the relevant RPCs.
2. **Diff ledger vs balance.** Run the integrity query in `docs/DATABASE.md` "Integrity check".
3. **Find the culprit.** `audit_logs` + `point_transactions` for the time window.
4. **Fix with a `manual_correction` transaction**, not by directly UPDATEing the balance. The ledger must stay consistent.
5. **Add a regression test** and ship the fix.

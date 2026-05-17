# Deployment

## One-time setup

### Supabase (production)

1. Create a Supabase project at supabase.com. Pick the closest region to your players.
2. From the dashboard, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-only)
3. Link the CLI:
   ```bash
   supabase link --project-ref <ref>
   supabase db push          # applies migrations to prod
   ```
4. Set Edge Function secrets:
   ```bash
   supabase secrets set RAPIDAPI_KEY=<key>
   supabase secrets set SYNC_SECRET=<random-32-byte-hex>
   supabase secrets set SUPABASE_URL=<url>
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<key>
   ```
5. Deploy Edge Functions:
   ```bash
   supabase functions deploy sync-lotto-calendar
   supabase functions deploy sync-lotto-results
   supabase functions deploy create-or-update-rounds-from-api
   supabase functions deploy create-player
   supabase functions deploy settle-round
   supabase functions deploy auto-close-rounds
   supabase functions deploy auto-settle-rounds
   ```
6. Enable Cron (Supabase dashboard → Database → Cron) with schedules from `plan.md` §7.
7. Bootstrap the first admin (one-off):
   ```bash
   supabase db remote query "$(cat scripts/bootstrap-admin.sql)"
   ```

### Vercel

1. Import the GitHub repo into Vercel.
2. Set env vars (Production + Preview + Development):

   | Var | Production | Preview | Development |
   | --- | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | prod | staging | local |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod anon | staging anon | local anon |
   | `SUPABASE_SERVICE_ROLE_KEY` | prod service | staging service | local service |
   | `RAPIDAPI_KEY` | (not used in Next.js, only Edge Fns) | — | — |
   | `SYNC_SECRET` | random 32-byte | random | random |
   | `NEXT_PUBLIC_APP_URL` | your domain | preview url | http://localhost:3000 |

3. Connect your domain. Enable HTTPS.

4. Deploy:
   ```bash
   vercel --prod
   ```

## Continuous deployment

Every push to `main` deploys to Vercel production (configure in Vercel project settings). Every PR gets a preview deploy. Migrations do **not** auto-apply on push — that's a manual `supabase db push` step done by the on-call dev after merging.

Recommended GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - uses: supabase/setup-cli@v1
      - run: supabase db reset --no-seed
      - run: pnpm test:sql
```

## Migration workflow

```bash
# 1. Develop locally
supabase migration new add_some_column
# edit supabase/migrations/<ts>_add_some_column.sql
supabase db reset           # apply + reseed local

# 2. Regenerate types
supabase gen types typescript --local > src/lib/supabase/database.types.ts

# 3. PR review with CI green

# 4. After merge, apply to prod
supabase link --project-ref <prod-ref>
supabase db push
```

If a migration fails on prod (extremely rare with idempotent SQL), Supabase logs the error in the dashboard. Fix forward — never reset prod.

## Rolling back

We don't roll back migrations. If a deploy is bad:

1. **Revert the merge commit** on `main`. Vercel auto-deploys the prior code.
2. If a *migration* introduced the bug, ship a **compensating migration** that fixes the schema forward.
3. If data was corrupted, restore from Supabase's PITR (Pro plan) or daily backup.

## Backups

- Supabase Pro: PITR enabled, 7-day retention.
- Supabase Free: daily backup, 7-day retention.
- Additionally, a weekly logical dump:
  ```bash
  supabase db dump --data-only > backups/$(date +%F).sql
  ```
  Store outside Supabase (S3, GCS, whatever).

## Smoke test after every deploy

A scripted Playwright run:

```bash
pnpm test:smoke         # hits prod with throwaway accounts
```

Covers: login, view today's rounds, place a guess, see it in history, log out. Fails the deploy if any step fails.

## Cost snapshot (rough, ~200 players)

| Service | Plan | Monthly |
| --- | --- | --- |
| Vercel | Hobby (or Pro if team) | $0–20 |
| Supabase | Free or Pro | $0–25 |
| RapidAPI | Thai Lotto plan | depends on calls/day |
| Domain | — | $10–15/yr |

The cron schedule in `plan.md` §7 keeps RapidAPI calls well under most plan caps.

## On-call checklist

When something breaks:

- [ ] Vercel deploy logs (frontend errors)
- [ ] Supabase logs → Edge Functions (sync issues)
- [ ] Supabase logs → Postgres (slow queries, RLS denials)
- [ ] `api_sync_logs` table (RapidAPI errors)
- [ ] `audit_logs` table (recent privileged actions)
- [ ] Ledger integrity query (`docs/DATABASE.md`)

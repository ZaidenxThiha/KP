# 2D / 3D Online Guessing Game

A free-to-play web game where players use virtual points to guess 2-digit and 3-digit numbers. Results come from the Thai Lotto New API (RapidAPI) with admin override. ~100–200 players.

> **Points are virtual game points only. Points have no cash value and cannot be exchanged for money or prizes.**

## Stack

Next.js 14 · Supabase (Postgres + Auth + Edge Functions) · Vercel · RapidAPI

## Quick start

```bash
pnpm install
cp .env.example .env.local            # fill in Supabase + RapidAPI keys
supabase start                        # local Postgres + Studio
supabase db reset                     # run migrations + seed
pnpm dev                              # http://localhost:3000
```

You'll need:

- **Node** ≥ 20, **pnpm** ≥ 9
- **Supabase CLI** ≥ 1.180
- A RapidAPI key with access to `thai-lotto-new-api.p.rapidapi.com`
- A Vercel account for deploys

## Roles & entry points

| Role | URL | Layout |
| --- | --- | --- |
| Player | `/` | Mobile-first |
| Officer | `/officer` | Desktop |
| Admin | `/admin` | Desktop |

## Documentation

Start with **[`CLAUDE.md`](./CLAUDE.md)** — it's the contract for working in this repo. Then:

- **[`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md)** — phased build order
- **[`plan.md`](./plan.md)** — original product spec
- **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** — system overview & data flow
- **[`docs/DATABASE.md`](./docs/DATABASE.md)** — schema reference
- **[`docs/SECURITY.md`](./docs/SECURITY.md)** — RLS, secrets, threat model
- **[`docs/API.md`](./docs/API.md)** — endpoint reference
- **[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)** — Vercel + Supabase setup
- **[`docs/TESTING.md`](./docs/TESTING.md)** — test strategy

## Status

Pre-MVP. See `IMPLEMENTATION_PLAN.md` for phase status.

## License

Proprietary. All rights reserved.

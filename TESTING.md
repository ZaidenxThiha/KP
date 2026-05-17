# Testing

Three layers, each catches a different class of bug.

| Layer | Tool | Catches |
| --- | --- | --- |
| Unit (TS) | Vitest | Pure logic: number-format validation, rate calculation, rule matching helpers |
| SQL | pgTAP | RPC behavior under concurrency, RLS, constraint violations |
| End-to-end | Playwright | The flows in `plan.md` §19 work from a real browser |

## Unit tests (Vitest)

Live in `tests/unit/` mirroring `src/`. Examples of high-value tests:

```ts
// tests/unit/lib/validation/guess.test.ts
import { describe, it, expect } from 'vitest';
import { guessSchema } from '@/lib/validation/guess';

describe('guessSchema', () => {
  it('rejects 3 digits for 2d', () => {
    expect(() => guessSchema.parse({ game_type: '2d', guess_number: '123', points_used: 1 }))
      .toThrow();
  });
  it('rejects leading non-digits', () => {
    expect(() => guessSchema.parse({ game_type: '2d', guess_number: 'a5', points_used: 1 }))
      .toThrow();
  });
  it('accepts "00" and "99" for 2d', () => {
    expect(guessSchema.parse({ game_type: '2d', guess_number: '00', points_used: 1 })).toBeDefined();
    expect(guessSchema.parse({ game_type: '2d', guess_number: '99', points_used: 1 })).toBeDefined();
  });
  it('rejects zero or negative points', () => {
    expect(() => guessSchema.parse({ game_type: '2d', guess_number: '25', points_used: 0 }))
      .toThrow();
  });
});
```

Run: `pnpm test`.

## SQL tests (pgTAP)

These are the most valuable tests in the project because they exercise the RPCs that actually move money.

Install pgTAP locally:

```bash
supabase functions new --no-template _
# in psql:
CREATE EXTENSION IF NOT EXISTS pgtap;
```

Tests live in `supabase/tests/`. Example for `place_guess`:

```sql
-- supabase/tests/place_guess.test.sql
begin;
select plan(8);

-- Setup
select tests.create_user('player1', 'player');
select tests.create_round('2d', 'open', interval '10 minutes');
select tests.set_payout('2d', 80);
select tests.credit_balance('player1', 1000);

-- happy path
select lives_ok(
  $$ select place_guess(tests.round_id(), '25', 100) $$,
  'valid guess goes through'
);
select is(
  (select points_balance from profiles where username = 'player1'),
  900::bigint,
  'balance is debited'
);
select is(
  (select winning_rate_snapshot from guesses where user_id = tests.user_id('player1')),
  80.00,
  'rate is snapshotted'
);

-- insufficient balance
select throws_like(
  $$ select place_guess(tests.round_id(), '25', 100000) $$,
  '%insufficient_balance%',
  'rejects when balance < points_used'
);

-- closed round
select tests.close_round();
select throws_like(
  $$ select place_guess(tests.round_id(), '25', 100) $$,
  '%round_closed%',
  'rejects when round is closed'
);

-- ...etc

select * from finish();
rollback;
```

Run all SQL tests:

```bash
pnpm test:sql       # = supabase test db
```

### Concurrency tests

The number-limit + balance check **must** be tested under concurrent load. A simple harness:

```ts
// tests/integration/place-guess-concurrency.test.ts
import { describe, it, expect } from 'vitest';
import { service } from '@/lib/supabase/service';

describe('place_guess concurrency', () => {
  it('does not exceed number limit under 50 parallel calls', async () => {
    // setup: rule says number 25 max 1000 points, 50 players each with 200 points
    // ...
    const results = await Promise.allSettled(
      players.map(p => service.rpc('place_guess', { round_id, guess_number: '25', points_used: 100 }))
    );
    const successful = results.filter(r => r.status === 'fulfilled').length;
    expect(successful).toBe(10);  // 1000 / 100 = exactly 10

    const total = await service
      .from('guesses')
      .select('points_used')
      .eq('round_id', round_id)
      .eq('guess_number', '25');
    expect(total.data!.reduce((s, g) => s + g.points_used, 0)).toBeLessThanOrEqual(1000);
  });
});
```

If this test ever fails, **stop and fix the RPC** — production data is at risk.

## E2E (Playwright)

`tests/e2e/`. Covers the flows that real users run.

Must-have specs:

- `e2e/player-flow.spec.ts` — login, see rounds, guess 2D, guess 3D, view history, view result after settlement
- `e2e/officer-flow.spec.ts` — login, create player (capture password on screen), give points, distribution history
- `e2e/admin-flow.spec.ts` — login, create officer, grant points, change winning rate, override result, approve settlement, view audit log

Run:

```bash
pnpm test:e2e             # against local
pnpm test:smoke           # against prod with throwaway accounts
```

## RLS tests

Run as the `anon` user and as each role from a separate test file (`supabase/tests/rls_*.test.sql`). Checklist from `docs/SECURITY.md` "RLS testing checklist".

## CI gates

A PR cannot merge unless:

- [ ] `pnpm lint` clean
- [ ] `pnpm typecheck` clean
- [ ] `pnpm test` green (unit)
- [ ] `pnpm test:sql` green (pgTAP)
- [ ] `pnpm test:e2e` green against local Supabase
- [ ] Bundle scan: no service/RapidAPI secrets in `.next/`

A deploy to prod additionally requires `pnpm test:smoke` green post-deploy.

## What not to test

- Don't test third-party libraries (Supabase client, Next.js, Tailwind).
- Don't write tests for getter/setter wrappers that just delegate.
- Don't snapshot-test rendered HTML for marketing pages — they change too often and tests rot.

The 80/20 here: **focus pgTAP on every RPC that moves points**, **focus Playwright on the role-walks**, everything else is bonus.

// k6 load test — 100 to 300 concurrent users.
//
//   k6 run -e SUPABASE_URL=https://xxx.supabase.co \
//          -e SUPABASE_ANON_KEY=... \
//          -e APP_URL=https://your-app.vercel.app \
//          k6/load-test.js
//
// Players authenticate against Supabase Auth and place guesses through the
// place_guess RPC — that path (Auth + Postgres + the pooler) is the capacity
// bottleneck, so it is what we measure. Anonymous app reads exercise the
// Next.js/Vercel layer. Pre-seed players with scripts/seed-load-test-players.
//
// On Supabase free tier, connection/throughput ceilings may dominate the
// result — that ceiling is the finding, reported with a tuning note, not a bug.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const SUPABASE_URL = __ENV.SUPABASE_URL;
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const APP_URL = __ENV.APP_URL || '';
const PLAYER_COUNT = Number(__ENV.PLAYER_COUNT || 300);

const guessErrors = new Rate('guess_errors');

export const options = {
  scenarios: {
    players: {
      executor: 'ramping-vus',
      exec: 'playerJourney',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 }, // ramp to 100
        { duration: '2m', target: 100 }, // hold
        { duration: '1m', target: 300 }, // ramp to 300
        { duration: '3m', target: 300 }, // hold at peak
        { duration: '1m', target: 0 }, // ramp down
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // < 1% transport failures
    http_req_duration: ['p(95)<2500'], // p95 budget (tune for free tier)
    guess_errors: ['rate<0.5'], // business rejections (number_full etc.) are OK
  },
};

function authHeaders(token) {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Each VU drives one pre-seeded player: P000001 … P00NNNN / player12345.
export function playerJourney() {
  const n = (__VU % PLAYER_COUNT) + 1;
  const username = 'P' + String(n).padStart(6, '0');

  // 1. Sign in.
  const login = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: `${username}@players.local`, password: 'player12345' }),
    { headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' } },
  );
  if (!check(login, { 'login ok': (r) => r.status === 200 })) {
    sleep(1);
    return;
  }
  const token = login.json('access_token');

  // 2. Read today's open rounds.
  const rounds = http.get(
    `${SUPABASE_URL}/rest/v1/rounds?round_date=eq.${new Date().toISOString().slice(0, 10)}` +
      `&status=eq.open&select=id,game_type`,
    { headers: authHeaders(token) },
  );
  check(rounds, { 'rounds ok': (r) => r.status === 200 });
  const list = rounds.json() || [];
  sleep(Math.random() * 2 + 1); // think time

  // 3. Place a guess via the RPC.
  if (list.length > 0) {
    const round = list[Math.floor(Math.random() * list.length)];
    const digits = round.game_type === '3d' ? 3 : 2;
    const number = String(Math.floor(Math.random() * 10 ** digits)).padStart(digits, '0');
    const guess = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/place_guess`,
      JSON.stringify({ p_round_id: round.id, p_guess_number: number, p_points_used: 100 }),
      { headers: authHeaders(token) },
    );
    // 2xx = placed; 4xx with a business code (number_full, insufficient_balance)
    // is expected under load and not a transport failure.
    guessErrors.add(guess.status >= 500);
    check(guess, { 'guess not 5xx': (r) => r.status < 500 });
  }
  sleep(Math.random() * 3 + 1);

  // 4. Anonymous app read (exercises the Vercel/Next.js layer).
  if (APP_URL) {
    http.get(`${APP_URL}/api/v1/results/today`);
  }
  sleep(Math.random() * 2 + 1);
}

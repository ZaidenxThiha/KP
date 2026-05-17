import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Runs against a real Supabase project. Set NEXT_PUBLIC_SUPABASE_URL,
// NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to enable it;
// otherwise it skips.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const enabled = Boolean(url && anonKey && serviceKey);

const PLAYERS = 30;
const LIMIT = 1000;
const STAKE = 100; // LIMIT / STAKE = exactly 10 winners
const PASSWORD = 'concurrency-test-pw';

describe.skipIf(!enabled)('place_guess concurrency', () => {
  let svc: SupabaseClient;
  let roundId: string;
  // One client per player, each holding that player's session JWT.
  const playerClients: SupabaseClient[] = [];

  beforeAll(async () => {
    svc = createClient(url!, serviceKey!, { auth: { persistSession: false } });
    const tag = Date.now().toString(36);

    const { data: round } = await svc
      .from('rounds')
      .insert({
        game_type: '2d',
        market: 'thai_myanmar',
        round_name: `ct-${tag}`,
        round_date: new Date().toISOString().slice(0, 10),
        close_time: new Date(Date.now() + 6 * 3600_000).toISOString(),
        status: 'open',
      })
      .select('id')
      .single();
    roundId = round!.id;

    await svc.from('payout_settings').upsert(
      {
        game_type: '2d',
        market: 'all',
        round_name: 'all',
        winning_rate: 80,
        payout_mode: 'multiplier_only',
        active: true,
      },
      { onConflict: 'game_type,market,round_name', ignoreDuplicates: true },
    );
    await svc.from('number_limit_rules').insert({
      game_type: '2d',
      market: 'all',
      rule_type: 'exact',
      rule_value: { number: '77' },
      max_points: LIMIT,
    });

    for (let i = 0; i < PLAYERS; i++) {
      const username = `CT${tag}${i}`;
      const email = `${username.toLowerCase()}@players.local`;
      const { data } = await svc.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { username, role: 'player' },
      });
      await svc.from('profiles').update({ points_balance: 1000 }).eq('auth_user_id', data.user!.id);

      const client = createClient(url!, anonKey!, { auth: { persistSession: false } });
      await client.auth.signInWithPassword({ email, password: PASSWORD });
      playerClients.push(client);
    }
  }, 180_000);

  it('never exceeds the number limit under parallel load', async () => {
    const results = await Promise.allSettled(
      playerClients.map((c) =>
        c.rpc('place_guess', {
          p_round_id: roundId,
          p_guess_number: '77',
          p_points_used: STAKE,
        }),
      ),
    );
    const ok = results.filter((r) => r.status === 'fulfilled' && !r.value.error).length;

    // Exactly LIMIT/STAKE guesses fit; the rest must be rejected number_full.
    expect(ok).toBe(LIMIT / STAKE);

    const committed = await svc
      .from('guesses')
      .select('points_used')
      .eq('round_id', roundId)
      .eq('guess_number', '77');
    const total = (committed.data ?? []).reduce((s, g) => s + g.points_used, 0);
    expect(total).toBeLessThanOrEqual(LIMIT);
  }, 120_000);
});

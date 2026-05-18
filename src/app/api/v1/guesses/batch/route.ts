import { createClient } from '@/lib/supabase/server';
import { apiOk, enforceRateLimit, ERROR_STATUS, parseBody, requireApiRole } from '@/lib/api';
import { batchGuessBodySchema } from '@/lib/validation';

type PlaceResult = {
  guess_id: string;
  possible_win_amount: number;
  remaining_balance: number;
};

// POST /api/v1/guesses/batch — place several guesses in one request. Each
// number is placed via its own place_guess call (its own transaction), so the
// outcome is reported per number: some may succeed while others hit a limit.
export async function POST(request: Request) {
  const auth = await requireApiRole('player');
  if ('error' in auth) return auth.error;

  const limited = enforceRateLimit(`guess-batch:${auth.profile.id}`, 20);
  if (limited) return limited;

  const body = await parseBody(request, batchGuessBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const results: {
    number: string;
    ok: boolean;
    possible_win_amount?: number;
    error?: string;
  }[] = [];
  let placed = 0;
  let remainingBalance: number | null = null;

  for (const item of body.data.items) {
    const { data, error } = await supabase.rpc('place_guess', {
      p_round_id: body.data.round_id,
      p_guess_number: item.number,
      p_points_used: item.points,
    });
    if (error) {
      const code = error.message?.trim();
      results.push({
        number: item.number,
        ok: false,
        error: code && code in ERROR_STATUS ? code : 'internal_error',
      });
    } else {
      const r = data as PlaceResult;
      remainingBalance = r.remaining_balance;
      results.push({
        number: item.number,
        ok: true,
        possible_win_amount: r.possible_win_amount,
      });
      placed += 1;
    }
  }

  return apiOk({
    results,
    placed,
    failed: results.length - placed,
    remaining_balance: remainingBalance,
  });
}

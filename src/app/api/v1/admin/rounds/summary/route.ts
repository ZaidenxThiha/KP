import { createServiceClient } from '@/lib/supabase/service';
import { apiError, apiOk, requireApiRole } from '@/lib/api';

// GET /api/v1/admin/rounds/summary?round_id=UUID
// Per-round betting summary for the admin: the winners (to verify payouts) and
// the house win — the total points players lost on the round.
export async function GET(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const roundId = new URL(request.url).searchParams.get('round_id');
  if (!roundId) return apiError('invalid_input', 'round_id is required');

  const svc = createServiceClient();
  const { data: guesses, error } = await svc
    .from('guesses')
    .select('guess_number, points_used, possible_win_amount, status, user_id')
    .eq('round_id', roundId);
  if (error) return apiError('internal_error', error.message);

  const rows = guesses ?? [];
  const winnerRows = rows.filter((g) => g.status === 'won');

  let nameById = new Map<string, string>();
  if (winnerRows.length) {
    const ids = Array.from(new Set(winnerRows.map((g) => g.user_id)));
    const { data: profs } = await svc.from('profiles').select('id, username').in('id', ids);
    nameById = new Map((profs ?? []).map((p) => [p.id, p.username]));
  }

  return apiOk({
    bet_count: rows.length,
    total_staked: rows.reduce((s, g) => s + g.points_used, 0),
    total_paid: winnerRows.reduce((s, g) => s + g.possible_win_amount, 0),
    // Lost stakes are the house's revenue.
    house_win: rows
      .filter((g) => g.status === 'lost')
      .reduce((s, g) => s + g.points_used, 0),
    winners: winnerRows.map((g) => ({
      username: nameById.get(g.user_id) ?? '—',
      guess_number: g.guess_number,
      points_used: g.points_used,
      payout: g.possible_win_amount,
    })),
  });
}

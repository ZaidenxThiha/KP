import { createClient } from '@/lib/supabase/server';
import { apiError, apiOk, mapRpcError, requireApiRole } from '@/lib/api';

type AvailRow = { guess_number: string; used: number | string; max_points: number | string | null };

// GET /api/v1/rounds/availability?round_id= — per-number used points and limit
// for the betting grid's fill bars.
export async function GET(request: Request) {
  const auth = await requireApiRole('player');
  if ('error' in auth) return auth.error;

  const roundId = new URL(request.url).searchParams.get('round_id');
  if (!roundId) return apiError('invalid_input', 'round_id is required');

  const supabase = createClient();
  const { data, error } = await supabase.rpc('round_number_availability', {
    p_round_id: roundId,
  });
  if (error) return mapRpcError(error);

  const numbers = ((data ?? []) as AvailRow[]).map((r) => ({
    number: r.guess_number,
    used: Number(r.used),
    max: r.max_points === null ? null : Number(r.max_points),
  }));
  return apiOk({ numbers });
}

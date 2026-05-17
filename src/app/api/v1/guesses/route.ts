import { createClient } from '@/lib/supabase/server';
import { apiOk, enforceRateLimit, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { placeGuessBodySchema } from '@/lib/validation';

// POST /api/v1/guesses — place a guess.
export async function POST(request: Request) {
  const auth = await requireApiRole('player');
  if ('error' in auth) return auth.error;

  const limited = enforceRateLimit(`guess:${auth.profile.id}`, 60);
  if (limited) return limited;

  const body = await parseBody(request, placeGuessBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('place_guess', {
    p_round_id: body.data.round_id,
    p_guess_number: body.data.guess_number,
    p_points_used: body.data.points_used,
  });
  if (error) return mapRpcError(error);
  return apiOk(data);
}

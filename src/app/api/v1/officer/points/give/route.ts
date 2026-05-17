import { createClient } from '@/lib/supabase/server';
import { apiOk, enforceRateLimit, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { givePointsBodySchema } from '@/lib/validation';

// POST /api/v1/officer/points/give
export async function POST(request: Request) {
  const auth = await requireApiRole('officer');
  if ('error' in auth) return auth.error;

  const limited = enforceRateLimit(`give:${auth.profile.id}`, 30);
  if (limited) return limited;

  const body = await parseBody(request, givePointsBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('officer_give_points', {
    p_player_id: body.data.player_id,
    p_amount: body.data.amount,
    p_note: body.data.note ?? undefined,
  });
  if (error) return mapRpcError(error);
  return apiOk(data);
}

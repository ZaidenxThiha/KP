import { createClient } from '@/lib/supabase/server';
import { apiOk, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { createRoundBodySchema } from '@/lib/validation';

// POST /api/v1/admin/rounds/create — create a manual round (open immediately).
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, createRoundBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_manual_round', {
    p_game_type: body.data.game_type,
    p_round_name: body.data.round_name,
    p_round_date: body.data.round_date,
    p_open_time: body.data.open_time ?? undefined,
    p_close_time: body.data.close_time,
    p_market: body.data.market,
  });
  if (error) return mapRpcError(error);
  return apiOk(data, 201);
}

import { createClient } from '@/lib/supabase/server';
import { apiOk, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { winningRateBodySchema } from '@/lib/validation';

// POST /api/v1/admin/winning-rates — set the active rate for a scope.
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, winningRateBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('set_winning_rate', {
    p_game_type: body.data.game_type,
    p_market: body.data.market,
    p_round_name: body.data.round_name,
    p_winning_rate: body.data.winning_rate,
    p_payout_mode: body.data.payout_mode,
    p_apply_to: body.data.apply_to,
  });
  if (error) return mapRpcError(error);
  return apiOk(data, 201);
}

import { createClient } from '@/lib/supabase/server';
import { apiOk, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { cancelRoundBodySchema } from '@/lib/validation';

// POST /api/v1/admin/rounds/cancel — cancel a round and refund pending guesses.
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, cancelRoundBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('cancel_round_and_refund', {
    p_round_id: body.data.round_id,
    p_reason: body.data.reason,
  });
  if (error) return mapRpcError(error);
  return apiOk(data);
}

import { createClient } from '@/lib/supabase/server';
import { apiOk, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { approveSettlementBodySchema } from '@/lib/validation';

// POST /api/v1/admin/rounds/approve-settlement — pick the final result and
// settle the round. The admin pressing approve means "settle now".
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, approveSettlementBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { error: approveError } = await supabase.rpc('approve_settlement', {
    p_round_id: body.data.round_id,
  });
  if (approveError) return mapRpcError(approveError);

  const { data, error } = await supabase.rpc('settle_round', {
    p_round_id: body.data.round_id,
  });
  if (error) return mapRpcError(error);
  return apiOk(data);
}

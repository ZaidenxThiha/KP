import { createClient } from '@/lib/supabase/server';
import { apiOk, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { manualResultBodySchema } from '@/lib/validation';

// POST /api/v1/admin/rounds/override-result — record a manual result.
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, manualResultBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('enter_manual_result', {
    p_round_id: body.data.round_id,
    p_result_number: body.data.result_number,
    p_note: body.data.note ?? undefined,
  });
  if (error) return mapRpcError(error);
  return apiOk(data);
}

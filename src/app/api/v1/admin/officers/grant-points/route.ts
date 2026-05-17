import { createClient } from '@/lib/supabase/server';
import { apiOk, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { grantPointsBodySchema } from '@/lib/validation';

// POST /api/v1/admin/officers/grant-points
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, grantPointsBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('admin_grant_points_to_officer', {
    p_officer_id: body.data.officer_id,
    p_amount: body.data.amount,
    p_note: body.data.note ?? undefined,
  });
  if (error) return mapRpcError(error);
  return apiOk(data);
}

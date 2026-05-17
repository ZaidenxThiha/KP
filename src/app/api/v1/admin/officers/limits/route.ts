import { createClient } from '@/lib/supabase/server';
import { apiOk, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { officerLimitsBodySchema } from '@/lib/validation';

// POST /api/v1/admin/officers/limits — upsert an officer's distribution caps.
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, officerLimitsBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('admin_set_officer_limits', {
    p_officer_id: body.data.officer_id,
    p_daily_give_limit: body.data.daily_give_limit ?? undefined,
    p_max_give_per_player: body.data.max_give_per_player ?? undefined,
    p_can_grant_welcome_bonus: body.data.can_grant_welcome_bonus ?? undefined,
  });
  if (error) return mapRpcError(error);
  return apiOk(data);
}

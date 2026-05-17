import { createClient } from '@/lib/supabase/server';
import { apiOk, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { gameSettingsBodySchema } from '@/lib/validation';

// POST /api/v1/admin/settings — partial update of the game_settings singleton.
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, gameSettingsBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('update_game_settings', {
    p_patch: body.data,
  });
  if (error) return mapRpcError(error);
  return apiOk(data);
}

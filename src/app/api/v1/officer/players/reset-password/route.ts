import { randomInt } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { apiError, apiOk, parseBody, requireApiRole } from '@/lib/api';
import { resetPasswordBodySchema } from '@/lib/validation';

const PW_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function genPassword(): string {
  const len = randomInt(6, 9);
  let out = '';
  for (let i = 0; i < len; i++) out += PW_CHARS[randomInt(0, PW_CHARS.length)];
  return out;
}

// POST /api/v1/officer/players/reset-password — new temp password, shown once.
export async function POST(request: Request) {
  const auth = await requireApiRole('officer');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, resetPasswordBodySchema);
  if ('error' in body) return body.error;

  const service = createServiceClient();
  const { data: player } = await service
    .from('profiles')
    .select('id, auth_user_id, assigned_officer_id, role')
    .eq('id', body.data.player_id)
    .single();
  if (!player || player.role !== 'player') return apiError('not_found');
  if (player.assigned_officer_id !== auth.profile.id) {
    return apiError('forbidden', 'Not your player');
  }

  const password = genPassword();
  const { error } = await service.auth.admin.updateUserById(player.auth_user_id!, {
    password,
  });
  if (error) return apiError('internal_error', error.message);

  // Audit through the officer's own session client.
  await createClient().rpc('record_audit', {
    p_action: 'player.reset_password',
    p_table: 'profiles',
    p_target: player.id,
  });

  return apiOk({ player_id: player.id, password });
}

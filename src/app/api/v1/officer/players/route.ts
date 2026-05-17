import { createClient } from '@/lib/supabase/server';
import { apiError, apiOk, requireApiRole } from '@/lib/api';

// GET /api/v1/officer/players — the officer's assigned players.
export async function GET() {
  const auth = await requireApiRole('officer');
  if ('error' in auth) return auth.error;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, points_balance, status')
    .eq('assigned_officer_id', auth.profile.id)
    .eq('role', 'player')
    .order('username', { ascending: true });
  if (error) return apiError('internal_error', error.message);
  return apiOk({ players: data ?? [] });
}

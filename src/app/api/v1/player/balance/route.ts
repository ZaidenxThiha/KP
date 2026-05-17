import { apiOk, requireApiRole } from '@/lib/api';

// GET /api/v1/player/balance
export async function GET() {
  const auth = await requireApiRole('player');
  if ('error' in auth) return auth.error;
  return apiOk({
    balance: auth.profile.points_balance,
    updated_at: auth.profile.updated_at,
  });
}

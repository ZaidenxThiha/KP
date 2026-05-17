import { createServiceClient } from '@/lib/supabase/service';
import { apiError, apiOk, requireSyncSecret } from '@/lib/api';

// POST /api/v1/internal/auto-settle-rounds — settle closed rounds that have a
// result, when auto-settle is enabled.
export async function POST(request: Request) {
  const denied = requireSyncSecret(request);
  if (denied) return denied;

  const { data, error } = await createServiceClient().rpc('run_auto_settlement');
  if (error) return apiError('internal_error', error.message);
  return apiOk({ settled: data ?? 0 });
}

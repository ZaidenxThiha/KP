import { createServiceClient } from '@/lib/supabase/service';
import { apiError, apiOk, requireSyncSecret } from '@/lib/api';

// POST /api/v1/internal/sync-lotto-results — triggers the Edge Function.
export async function POST(request: Request) {
  const denied = requireSyncSecret(request);
  if (denied) return denied;

  const { data, error } = await createServiceClient().functions.invoke('sync-lotto-results');
  if (error) return apiError('internal_error', error.message);
  return apiOk({ triggered: 'sync-lotto-results', result: data });
}

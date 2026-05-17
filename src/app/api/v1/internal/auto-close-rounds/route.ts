import { createServiceClient } from '@/lib/supabase/service';
import { apiError, apiOk, requireSyncSecret } from '@/lib/api';

// POST /api/v1/internal/auto-close-rounds — close rounds past their close_time.
export async function POST(request: Request) {
  const denied = requireSyncSecret(request);
  if (denied) return denied;

  const { data, error } = await createServiceClient().rpc('close_due_rounds');
  if (error) return apiError('internal_error', error.message);
  return apiOk({ closed: data ?? 0 });
}

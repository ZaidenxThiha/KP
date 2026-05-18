import { createServiceClient } from '@/lib/supabase/service';
import { apiError, apiOk, requireApiRole } from '@/lib/api';

// POST /api/v1/admin/rounds/create-daily
// Creates the four standard daily 2D rounds (11:00 / 12:01 / 15:00 / 16:30)
// for a date via create_daily_2d_rounds. Idempotent; weekends are skipped.
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  let roundDate: string | undefined;
  try {
    const body = (await request.json()) as { round_date?: string } | null;
    roundDate = body?.round_date;
  } catch {
    // No body — fall back to today.
  }
  if (roundDate && !/^\d{4}-\d{2}-\d{2}$/.test(roundDate)) {
    return apiError('invalid_input', 'round_date must be YYYY-MM-DD');
  }
  const p_date = roundDate || new Date().toISOString().slice(0, 10);

  // create_daily_2d_rounds is granted to service_role only.
  const { data, error } = await createServiceClient().rpc('create_daily_2d_rounds', { p_date });
  if (error) return apiError('internal_error', error.message);

  return apiOk({ round_date: p_date, created: data ?? 0 });
}

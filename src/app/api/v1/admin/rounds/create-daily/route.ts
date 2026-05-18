import { createServiceClient } from '@/lib/supabase/service';
import { apiError, apiOk, requireApiRole } from '@/lib/api';
import { mmToday } from '@/lib/datetime';

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
  const p_date = roundDate || mmToday();

  // create_daily_2d_rounds is granted to service_role only.
  const { data, error } = await createServiceClient().rpc('create_daily_2d_rounds', { p_date });
  if (error) return apiError('internal_error', error.message);

  // The RPC returns 0 both for weekends (markets closed) and for dates whose
  // rounds already exist — tell them apart so the UI can explain precisely.
  const created = data ?? 0;
  const weekend = [0, 6].includes(new Date(`${p_date}T00:00:00Z`).getUTCDay());
  const reason = created > 0 ? 'created' : weekend ? 'weekend' : 'exists';

  return apiOk({ round_date: p_date, created, reason });
}

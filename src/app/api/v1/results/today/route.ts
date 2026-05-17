import { createClient } from '@/lib/supabase/server';
import { apiError, apiOk } from '@/lib/api';

// GET /api/v1/results/today — rounds settled today, with their final result.
export async function GET() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('rounds')
    .select('id, game_type, market, round_name, round_date, final_result_number, status')
    .eq('round_date', today)
    .eq('status', 'resulted')
    .order('close_time', { ascending: false });
  if (error) return apiError('internal_error', error.message);
  return apiOk({ results: data ?? [] });
}

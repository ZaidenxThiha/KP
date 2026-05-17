import { createClient } from '@/lib/supabase/server';
import { apiError, apiOk, requireApiRole } from '@/lib/api';
import { pageQuerySchema } from '@/lib/validation';

// GET /api/v1/player/history?page=1&page_size=20 — the player's own guesses.
export async function GET(request: Request) {
  const auth = await requireApiRole('player');
  if ('error' in auth) return auth.error;

  const url = new URL(request.url);
  const q = pageQuerySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    page_size: url.searchParams.get('page_size') ?? undefined,
  });
  if (!q.success) return apiError('invalid_input', 'Bad pagination');
  const { page, page_size } = q.data;
  const from = (page - 1) * page_size;

  const supabase = createClient();
  const { data, error, count } = await supabase
    .from('guesses')
    .select(
      'id, game_type, guess_number, points_used, possible_win_amount, status, ' +
        'created_at, settled_at, round:rounds(round_name, final_result_number)',
      { count: 'exact' },
    )
    .eq('user_id', auth.profile.id)
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) return apiError('internal_error', error.message);

  return apiOk({ guesses: data ?? [], page, page_size, total: count ?? 0 });
}

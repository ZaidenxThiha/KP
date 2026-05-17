import { createClient } from '@/lib/supabase/server';
import { apiError, apiOk, requireApiRole } from '@/lib/api';
import { pageQuerySchema } from '@/lib/validation';

// GET /api/v1/admin/audit-logs?actor=&action_type=&from=&to=&page=
export async function GET(request: Request) {
  const auth = await requireApiRole('admin');
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
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const actor = url.searchParams.get('actor');
  const actionType = url.searchParams.get('action_type');
  const after = url.searchParams.get('from');
  const before = url.searchParams.get('to');
  if (actor) query = query.eq('actor_id', actor);
  if (actionType) query = query.eq('action_type', actionType);
  if (after) query = query.gte('created_at', after);
  if (before) query = query.lte('created_at', before);

  const { data, error, count } = await query.range(from, from + page_size - 1);
  if (error) return apiError('internal_error', error.message);
  return apiOk({ logs: data ?? [], page, page_size, total: count ?? 0 });
}

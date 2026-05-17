import { createClient } from '@/lib/supabase/server';
import { apiOk, mapRpcError, parseBody, requireApiRole } from '@/lib/api';
import { numberLimitBodySchema } from '@/lib/validation';

// POST /api/v1/admin/number-limits — create a number-limit rule.
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, numberLimitBodySchema);
  if ('error' in body) return body.error;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_number_limit_rule', {
    p_game_type: body.data.game_type,
    p_market: body.data.market,
    p_rule_type: body.data.rule_type,
    p_rule_value: body.data.rule_value,
    p_max_points: body.data.max_points,
  });
  if (error) return mapRpcError(error);
  return apiOk(data, 201);
}

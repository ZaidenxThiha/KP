// Settles one round on demand. Body: { round_id }. Runs approve_settlement
// then settle_round so a round with a result is fully resolved.
import { serviceClient, checkSyncSecret, json } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (!checkSyncSecret(req)) return json({ error: 'forbidden' }, 403);

  let roundId: string | undefined;
  try {
    roundId = (await req.json())?.round_id;
  } catch {
    return json({ error: 'invalid_input' }, 400);
  }
  if (!roundId) return json({ error: 'invalid_input' }, 400);

  const supabase = serviceClient();
  const approve = await supabase.rpc('approve_settlement', { p_round_id: roundId });
  if (approve.error) return json({ ok: false, error: approve.error.message }, 409);

  const settle = await supabase.rpc('settle_round', { p_round_id: roundId });
  if (settle.error) return json({ ok: false, error: settle.error.message }, 409);

  return json({ ok: true, result: settle.data });
});

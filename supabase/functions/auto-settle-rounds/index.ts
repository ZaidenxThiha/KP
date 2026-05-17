// Settles closed rounds that have a result, when auto-settle is enabled and
// admin approval is not required. Scheduled every 5 minutes.
import { serviceClient, checkSyncSecret, json } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (!checkSyncSecret(req)) return json({ error: 'forbidden' }, 403);

  const { data, error } = await serviceClient().rpc('run_auto_settlement');
  if (error) return json({ ok: false, error: error.message }, 500);
  return json({ ok: true, settled: data ?? 0 });
});

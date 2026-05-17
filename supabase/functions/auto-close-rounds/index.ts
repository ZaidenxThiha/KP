// Closes rounds whose close_time has passed. Scheduled every minute.
import { serviceClient, checkSyncSecret, json } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (!checkSyncSecret(req)) return json({ error: 'forbidden' }, 403);

  const { data, error } = await serviceClient().rpc('close_due_rounds');
  if (error) return json({ ok: false, error: error.message }, 500);
  return json({ ok: true, closed: data ?? 0 });
});

// Materialises rounds from cached external_draws — creates a round for any
// draw that does not yet have one. Scheduled every 15m by Supabase Cron.
import { serviceClient, checkSyncSecret, json } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (!checkSyncSecret(req)) return json({ error: 'forbidden' }, 403);

  const supabase = serviceClient();
  const { data: settings } = await supabase.from('game_settings').select('*').single();
  const closeBefore = settings?.default_close_before_minutes ?? 10;

  let created = 0;
  let errorMessage: string | null = null;

  try {
    // Upcoming draws from today onward.
    const today = new Date().toISOString().slice(0, 10);
    const { data: draws } = await supabase
      .from('external_draws')
      .select('*')
      .gte('draw_date', today);

    for (const d of draws ?? []) {
      const { data: existing } = await supabase
        .from('rounds')
        .select('id')
        .eq('external_draw_ref', d.id)
        .maybeSingle();
      if (existing) continue;

      // Close betting `closeBefore` minutes before midnight of the draw date.
      const closeTime = new Date(`${d.draw_date}T23:59:00Z`);
      closeTime.setMinutes(closeTime.getMinutes() - closeBefore);

      await supabase.from('rounds').insert({
        game_type: d.game_type,
        market: d.market,
        round_name: d.draw_name ?? 'all',
        round_date: d.draw_date,
        open_time: new Date().toISOString(),
        close_time: closeTime.toISOString(),
        status: 'scheduled',
        external_draw_ref: d.id,
        api_result_number: d.result_number,
      });
      created++;
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  await supabase.from('api_sync_logs').insert({
    sync_type: 'rounds',
    success: errorMessage === null,
    rows_affected: created,
    error_message: errorMessage,
  });
  return json({ ok: errorMessage === null, created, error: errorMessage });
});

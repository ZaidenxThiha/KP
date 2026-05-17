// Fetches live results from RapidAPI, updates external_draws and copies the
// result onto matching rounds (rounds.api_result_number). Scheduled every 15m.
import { serviceClient, checkSyncSecret, json, RAPIDAPI_HOST } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (!checkSyncSecret(req)) return json({ error: 'forbidden' }, 403);

  const supabase = serviceClient();
  const rapidKey = Deno.env.get('RAPIDAPI_KEY');
  const { data: settings } = await supabase.from('game_settings').select('*').single();
  const path = settings?.rapidapi_results_path ?? 'live';

  let status = 0;
  let ok = false;
  let rows = 0;
  let errorMessage: string | null = null;

  try {
    if (!rapidKey) throw new Error('RAPIDAPI_KEY is not configured');
    const res = await fetch(`https://${RAPIDAPI_HOST}/${path}`, {
      headers: { 'X-RapidAPI-Key': rapidKey, 'X-RapidAPI-Host': RAPIDAPI_HOST },
    });
    status = res.status;
    if (!res.ok) throw new Error(`RapidAPI returned ${res.status}`);

    const payload = await res.json();
    const draws: Record<string, unknown>[] = Array.isArray(payload)
      ? payload
      : ((payload.results ?? payload.data ?? [payload]) as Record<string, unknown>[]);

    for (const d of draws) {
      const drawDate = String(d.date ?? d.draw_date ?? '');
      const result = d.result ?? d.result_number ?? d.number ?? null;
      if (!drawDate || result == null) continue;
      const gameType = String(d.game_type ?? '2d');

      await supabase
        .from('external_draws')
        .update({ result_number: String(result), status: 'resulted' })
        .eq('source', 'thai_lotto_new_api')
        .eq('game_type', gameType)
        .eq('draw_date', drawDate);

      // Copy the result onto any linked round that has no result yet.
      const { data: linked } = await supabase
        .from('external_draws')
        .select('id')
        .eq('draw_date', drawDate)
        .eq('game_type', gameType);
      for (const ed of linked ?? []) {
        await supabase
          .from('rounds')
          .update({ api_result_number: String(result) })
          .eq('external_draw_ref', ed.id)
          .is('api_result_number', null);
      }
      rows++;
    }
    ok = true;
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  await supabase.from('api_sync_logs').insert({
    sync_type: 'results',
    endpoint: path,
    response_status: status,
    success: ok,
    rows_affected: rows,
    error_message: errorMessage,
  });
  return json({ ok, rows, error: errorMessage }, ok ? 200 : 500);
});

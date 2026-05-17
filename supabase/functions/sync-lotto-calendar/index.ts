// Fetches the draw calendar from RapidAPI and caches it in external_draws.
// Scheduled daily (~04:00) by Supabase Cron.
import { serviceClient, checkSyncSecret, json, RAPIDAPI_HOST } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (!checkSyncSecret(req)) return json({ error: 'forbidden' }, 403);

  const supabase = serviceClient();
  const rapidKey = Deno.env.get('RAPIDAPI_KEY');
  const { data: settings } = await supabase.from('game_settings').select('*').single();
  const path = settings?.rapidapi_calendar_path ?? 'calendar';
  const fallback = settings?.rapidapi_calendar_fallback_path ?? 'beta-calendar';

  let status = 0;
  let ok = false;
  let rows = 0;
  let errorMessage: string | null = null;

  try {
    if (!rapidKey) throw new Error('RAPIDAPI_KEY is not configured');
    const headers = { 'X-RapidAPI-Key': rapidKey, 'X-RapidAPI-Host': RAPIDAPI_HOST };
    let res = await fetch(`https://${RAPIDAPI_HOST}/${path}`, { headers });
    if (!res.ok) res = await fetch(`https://${RAPIDAPI_HOST}/${fallback}`, { headers });
    status = res.status;
    if (!res.ok) throw new Error(`RapidAPI returned ${res.status}`);

    const payload = await res.json();
    // The exact shape varies — adapt these field names to the live API.
    const draws: Record<string, unknown>[] = Array.isArray(payload)
      ? payload
      : ((payload.draws ?? payload.data ?? []) as Record<string, unknown>[]);

    for (const d of draws) {
      const drawDate = String(d.date ?? d.draw_date ?? '');
      if (!drawDate) continue;
      await supabase.from('external_draws').upsert(
        {
          source: 'thai_lotto_new_api',
          game_type: String(d.game_type ?? '2d'),
          market: 'thai_myanmar',
          draw_date: drawDate,
          external_draw_id: String(d.id ?? d.draw_id ?? drawDate),
          draw_name: (d.name ?? null) as string | null,
          raw_payload: d,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'source,game_type,market,draw_date,external_draw_id' },
      );
      rows++;
    }
    ok = true;
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  await supabase.from('api_sync_logs').insert({
    sync_type: 'calendar',
    endpoint: path,
    response_status: status,
    success: ok,
    rows_affected: rows,
    error_message: errorMessage,
  });
  return json({ ok, rows, error: errorMessage }, ok ? 200 : 500);
});

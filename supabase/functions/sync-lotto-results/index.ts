// Pulls the latest Thai 2D results from api.thaistock2d.com (free, no API key),
// caches them in external_draws, and applies each draw's result to the round
// whose round_name matches the draw time (11:00 / 12:01 / 15:00 / 16:30).
// Scheduled every 15m.
import { serviceClient, checkSyncSecret, json } from '../_shared/client.ts';

const THAISTOCK2D_LIVE = 'https://api.thaistock2d.com/live';

Deno.serve(async (req) => {
  if (!checkSyncSecret(req)) return json({ error: 'forbidden' }, 403);

  const supabase = serviceClient();
  let status = 0;
  let ok = false;
  let draws = 0;
  let roundsUpdated = 0;
  let errorMessage: string | null = null;

  try {
    // api.thaistock2d.com returns an empty body without a User-Agent.
    const res = await fetch(THAISTOCK2D_LIVE, {
      headers: { 'User-Agent': 'guessing-game-sync/1.0', Accept: 'application/json' },
    });
    status = res.status;
    if (!res.ok) throw new Error(`thaistock2d returned ${res.status}`);

    const payload = await res.json();
    const results: Record<string, unknown>[] = Array.isArray(payload?.result)
      ? payload.result
      : [];

    for (const r of results) {
      const drawDate = String(r.stock_date ?? '').slice(0, 10);
      const twod = r.twod != null ? String(r.twod) : '';
      const openTime = String(r.open_time ?? '');
      const roundName = openTime.slice(0, 5); // "11:00:00" -> "11:00"
      if (!drawDate || !twod || twod === '--' || !openTime) continue;

      // Cache the raw draw.
      await supabase.from('external_draws').upsert(
        {
          source: 'thaistock2d',
          game_type: '2d',
          market: 'thai_myanmar',
          draw_date: drawDate,
          external_draw_id: openTime,
          draw_name: openTime,
          result_number: twod,
          status: 'resulted',
          raw_payload: r,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'source,game_type,market,draw_date,external_draw_id' },
      );
      draws++;

      // Apply the result to the matching round (same date + draw time) if it
      // does not have an API result yet.
      const { data: updated } = await supabase
        .from('rounds')
        .update({ api_result_number: twod })
        .eq('game_type', '2d')
        .eq('round_date', drawDate)
        .eq('round_name', roundName)
        .is('api_result_number', null)
        .select('id');
      roundsUpdated += updated?.length ?? 0;
    }
    ok = true;
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  await supabase.from('api_sync_logs').insert({
    sync_type: 'results',
    endpoint: 'thaistock2d/live',
    response_status: status,
    success: ok,
    rows_affected: draws,
    error_message: errorMessage,
  });

  return json({ ok, draws, rounds_updated: roundsUpdated, error: errorMessage }, ok ? 200 : 500);
});

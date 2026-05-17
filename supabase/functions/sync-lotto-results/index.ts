// Pulls the latest Thai 2D results from api.thaistock2d.com (free, no API key)
// and applies them to 2D rounds. The /live endpoint returns the four daily
// draws (11:00, 12:01, 15:00, 16:30) for the most recent trading day; the
// 16:30 close is treated as the day's final result. Scheduled every 15m.
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

    // Cache every finalized draw in external_draws.
    for (const r of results) {
      const drawDate = String(r.stock_date ?? '').slice(0, 10);
      const twod = r.twod != null ? String(r.twod) : '';
      const openTime = String(r.open_time ?? '');
      if (!drawDate || !twod || twod === '--' || !openTime) continue;

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
    }

    // Apply the day's final draw (16:30 — last entry) to any open/closed 2D
    // round on that date that has no API result yet.
    const final = results[results.length - 1];
    if (final) {
      const drawDate = String(final.stock_date ?? '').slice(0, 10);
      const twod = final.twod != null ? String(final.twod) : '';
      if (drawDate && twod && twod !== '--') {
        const { data: updated } = await supabase
          .from('rounds')
          .update({ api_result_number: twod })
          .eq('game_type', '2d')
          .eq('round_date', drawDate)
          .in('status', ['open', 'closed'])
          .is('api_result_number', null)
          .select('id');
        roundsUpdated = updated?.length ?? 0;
      }
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

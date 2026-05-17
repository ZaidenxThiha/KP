import { createClient } from '@/lib/supabase/server';
import { apiError, apiOk } from '@/lib/api';

type RoundRow = {
  id: string;
  game_type: string;
  market: string;
  round_name: string;
  round_date: string;
  close_time: string;
  status: string;
};
type RateRow = {
  game_type: string;
  market: string;
  round_name: string;
  winning_rate: number;
  payout_mode: string;
};

// GET /api/v1/rounds/today — today's rounds with their current winning rates.
export async function GET() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: roundData, error } = await supabase
    .from('rounds')
    .select('id, game_type, market, round_name, round_date, close_time, status')
    .eq('round_date', today)
    .order('close_time', { ascending: true });
  if (error) return apiError('internal_error', error.message);
  const rounds = (roundData ?? []) as RoundRow[];

  const { data: rateData } = await supabase
    .from('payout_settings')
    .select('game_type, market, round_name, winning_rate, payout_mode')
    .eq('active', true);
  const rates = (rateData ?? []) as RateRow[];

  const rateFor = (gameType: string, market: string, roundName: string) =>
    (rates ?? [])
      .filter(
        (r) =>
          r.game_type === gameType &&
          (r.market === market || r.market === 'all') &&
          (r.round_name === roundName || r.round_name === 'all'),
      )
      .sort(
        (a, b) =>
          Number(b.market === market) - Number(a.market === market) ||
          Number(b.round_name === roundName) - Number(a.round_name === roundName),
      )[0] ?? null;

  const result = (rounds ?? []).map((r) => ({
    ...r,
    rate: rateFor(r.game_type, r.market, r.round_name),
  }));
  return apiOk({ rounds: result });
}

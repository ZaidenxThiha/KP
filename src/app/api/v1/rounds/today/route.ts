import { createClient } from '@/lib/supabase/server';
import { apiError, apiOk } from '@/lib/api';
import { mmToday } from '@/lib/datetime';

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

// GET /api/v1/rounds/today — the currently relevant rounds (today's, plus any
// still-active round dated for a future day) with their current winning rates.
export async function GET() {
  const supabase = createClient();
  const today = mmToday();

  // "Active" = still scheduled/open/closed (bettable now or awaiting a result),
  // regardless of round_date, plus everything dated today for context. This is
  // what lets players bet on tomorrow's rounds once today's have all closed.
  const { data: roundData, error } = await supabase
    .from('rounds')
    .select('id, game_type, market, round_name, round_date, close_time, status')
    .or(`round_date.gte.${today},status.in.(scheduled,open,closed)`)
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

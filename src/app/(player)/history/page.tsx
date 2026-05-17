import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default async function HistoryPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();
  const { data: guesses } = await supabase
    .from('guesses')
    .select('id, game_type, guess_number, points_used, possible_win_amount, status, created_at')
    .eq('user_id', profile!.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-bold">My Guesses</h1>
      {(guesses ?? []).length === 0 && (
        <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">No guesses yet.</p>
      )}
      {(guesses ?? []).map((g) => (
        <div
          key={g.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
        >
          <div>
            <p className="text-lg font-bold tracking-widest">{g.guess_number}</p>
            <p className="text-xs text-gray-500">
              {g.game_type.toUpperCase()} · {g.points_used.toLocaleString()} pts
            </p>
          </div>
          <div className="text-right">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLE[g.status] ?? 'bg-gray-100'
              }`}
            >
              {g.status}
            </span>
            {g.status === 'won' && (
              <p className="mt-1 text-sm font-semibold text-green-700">
                +{g.possible_win_amount.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { mmDate } from '@/lib/datetime';
import { t } from '@/lib/strings';

export const dynamic = 'force-dynamic';

// Win / loss keep a soft green / red; every other status stays neutral gray.
const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  won: 'bg-green-50 text-green-700',
  lost: 'bg-red-50 text-red-600',
  refunded: 'bg-gray-100 text-gray-600',
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

  const list = guesses ?? [];
  const statusText = t.status as Record<string, string>;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-bold text-brand">{t.history.title}</h1>
      {list.length === 0 && (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-base text-gray-400">
          {t.history.empty}
        </p>
      )}
      {list.map((g) => (
        <div
          key={g.id}
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5"
        >
          <div>
            <p className="text-2xl font-bold tracking-widest text-gray-900">{g.guess_number}</p>
            <p className="mt-0.5 text-sm text-gray-400">
              {g.game_type.toUpperCase()} · {g.points_used.toLocaleString()} {t.kyat} ·{' '}
              {mmDate(g.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
                STATUS_STYLE[g.status] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {statusText[g.status] ?? g.status}
            </span>
            {g.status === 'won' && (
              <p className="text-base font-semibold text-green-700">
                +{g.possible_win_amount.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

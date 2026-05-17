import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PlayerHome() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, game_type, round_name, close_time, status')
    .eq('round_date', today)
    .order('close_time', { ascending: true });

  const open = (rounds ?? []).filter((r) => r.status === 'open');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-gray-900">Today&apos;s Rounds</h1>
      {open.length === 0 && (
        <p className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No open rounds right now. Check back later.
        </p>
      )}
      {open.map((r) => (
        <Link
          key={r.id}
          href={`/guess?round=${r.id}`}
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition active:scale-[0.99]"
        >
          <div>
            <p className="font-semibold uppercase text-gray-900">{r.game_type}</p>
            <p className="text-sm text-gray-500">{r.round_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">closes</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(r.close_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-300"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
        </Link>
      ))}
      <p className="mt-1 text-center text-xs text-gray-400">
        Points are virtual game points only — no cash value.
      </p>
    </div>
  );
}

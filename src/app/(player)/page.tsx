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
      <h1 className="text-lg font-bold">Today&apos;s Rounds</h1>
      {open.length === 0 && (
        <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
          No open rounds right now. Check back later.
        </p>
      )}
      {open.map((r) => (
        <Link
          key={r.id}
          href={`/guess?round=${r.id}`}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
        >
          <div>
            <p className="font-semibold uppercase">{r.game_type}</p>
            <p className="text-sm text-gray-500">{r.round_name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">closes</p>
            <p className="text-sm font-medium">
              {new Date(r.close_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </Link>
      ))}
      <p className="mt-2 text-xs text-gray-400">
        Points are virtual game points only — no cash value.
      </p>
    </div>
  );
}

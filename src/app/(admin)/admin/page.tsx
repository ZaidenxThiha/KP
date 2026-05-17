import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [players, officers, roundsToday, pending] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'officer'),
    supabase.from('rounds').select('*', { count: 'exact', head: true }).eq('round_date', today),
    supabase.from('guesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const cards = [
    { label: 'Players', value: players.count ?? 0 },
    { label: 'Officers', value: officers.count ?? 0 },
    { label: 'Rounds today', value: roundsToday.count ?? 0 },
    { label: 'Pending guesses', value: pending.count ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{c.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-gray-900">
              {c.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: results } = await supabase
    .from('rounds')
    .select('id, game_type, round_name, final_result_number')
    .eq('round_date', today)
    .eq('status', 'resulted')
    .order('close_time', { ascending: false });

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-bold">Today&apos;s Results</h1>
      {(results ?? []).length === 0 && (
        <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
          No results published yet today.
        </p>
      )}
      {(results ?? []).map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
        >
          <div>
            <p className="font-semibold uppercase">{r.game_type}</p>
            <p className="text-sm text-gray-500">{r.round_name}</p>
          </div>
          <p className="text-2xl font-bold tracking-widest text-accent">
            {r.final_result_number}
          </p>
        </div>
      ))}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminApiResultsPage() {
  const supabase = createClient();
  const [{ data: logs }, { data: draws }] = await Promise.all([
    supabase
      .from('api_sync_logs')
      .select('id, sync_type, success, response_status, rows_affected, error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('external_draws')
      .select('id, game_type, draw_date, draw_name, result_number, status')
      .order('draw_date', { ascending: false })
      .limit(25),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">API Results</h1>

      <section>
        <h2 className="mb-2 font-semibold">Recent sync runs</h2>
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-2">When</th>
              <th className="p-2">Type</th>
              <th className="p-2">OK</th>
              <th className="p-2">Rows</th>
              <th className="p-2">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(logs ?? []).map((l) => (
              <tr key={l.id}>
                <td className="p-2">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-2">{l.sync_type}</td>
                <td className="p-2">{l.success ? 'yes' : 'no'}</td>
                <td className="p-2">{l.rows_affected ?? '—'}</td>
                <td className="p-2 text-red-600">{l.error_message ?? ''}</td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No sync runs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Cached draws</h2>
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Game</th>
              <th className="p-2">Name</th>
              <th className="p-2">Result</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(draws ?? []).map((d) => (
              <tr key={d.id}>
                <td className="p-2">{d.draw_date}</td>
                <td className="p-2 uppercase">{d.game_type}</td>
                <td className="p-2">{d.draw_name ?? '—'}</td>
                <td className="p-2">{d.result_number ?? '—'}</td>
                <td className="p-2">{d.status}</td>
              </tr>
            ))}
            {(draws ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No cached draws — run a calendar sync.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

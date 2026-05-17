import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/DataTable';

export const dynamic = 'force-dynamic';

type SyncLog = {
  id: string;
  sync_type: string;
  success: boolean;
  response_status: number | null;
  rows_affected: number | null;
  error_message: string | null;
  created_at: string;
};

type Draw = {
  id: string;
  game_type: string;
  draw_date: string;
  draw_name: string | null;
  result_number: string | null;
  status: string;
};

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
      <h1 className="text-lg font-semibold text-gray-900">API Results</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Recent sync runs</h2>
        <DataTable<SyncLog>
          rows={(logs ?? []) as SyncLog[]}
          rowKey={(l) => l.id}
          empty="No sync runs yet."
          columns={[
            { header: 'When', cell: (l) => new Date(l.created_at).toLocaleString() },
            { header: 'Type', cell: (l) => l.sync_type },
            {
              header: 'Result',
              cell: (l) =>
                l.success ? (
                  <span className="text-gray-600">OK</span>
                ) : (
                  <span className="text-red-600">Failed</span>
                ),
            },
            { header: 'Rows', align: 'right', cell: (l) => l.rows_affected ?? '—' },
            {
              header: 'Error',
              cell: (l) =>
                l.error_message ? (
                  <span className="text-red-600">{l.error_message}</span>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Cached draws</h2>
        <DataTable<Draw>
          rows={(draws ?? []) as Draw[]}
          rowKey={(d) => d.id}
          empty="No cached draws — run a calendar sync."
          columns={[
            { header: 'Date', cell: (d) => d.draw_date },
            { header: 'Game', cell: (d) => <span className="uppercase">{d.game_type}</span> },
            { header: 'Name', cell: (d) => d.draw_name ?? '—' },
            {
              header: 'Result',
              cell: (d) => (
                <span className="font-medium tracking-widest text-gray-900">
                  {d.result_number ?? '—'}
                </span>
              ),
            },
            {
              header: 'Status',
              cell: (d) => <span className="capitalize text-gray-500">{d.status}</span>,
            },
          ]}
        />
      </section>
    </div>
  );
}

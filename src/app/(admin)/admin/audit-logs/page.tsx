import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/DataTable';
import { mmDateTime } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

type Log = {
  id: string;
  actor_role: string | null;
  action_type: string;
  target_table: string | null;
  note: string | null;
  created_at: string;
};

export default async function AdminAuditLogsPage() {
  const { data: logs } = await createClient()
    .from('audit_logs')
    .select('id, actor_role, action_type, target_table, note, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-gray-900">Audit Logs</h1>
      <DataTable<Log>
        rows={(logs ?? []) as Log[]}
        rowKey={(l) => l.id}
        empty="No audit entries yet."
        columns={[
          { header: 'When', cell: (l) => mmDateTime(l.created_at) },
          { header: 'Actor', cell: (l) => <span className="capitalize">{l.actor_role ?? '—'}</span> },
          {
            header: 'Action',
            cell: (l) => <span className="font-medium text-gray-900">{l.action_type}</span>,
          },
          { header: 'Table', cell: (l) => l.target_table ?? '—' },
          { header: 'Note', cell: (l) => <span className="text-gray-500">{l.note ?? '—'}</span> },
        ]}
      />
    </div>
  );
}

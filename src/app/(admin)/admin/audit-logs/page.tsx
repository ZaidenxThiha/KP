import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const { data: logs } = await createClient()
    .from('audit_logs')
    .select('id, actor_role, action_type, target_table, note, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Audit Logs</h1>
      <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-2">When</th>
            <th className="p-2">Actor</th>
            <th className="p-2">Action</th>
            <th className="p-2">Table</th>
            <th className="p-2">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(logs ?? []).map((l) => (
            <tr key={l.id}>
              <td className="p-2">{new Date(l.created_at).toLocaleString()}</td>
              <td className="p-2">{l.actor_role ?? '—'}</td>
              <td className="p-2 font-medium">{l.action_type}</td>
              <td className="p-2">{l.target_table ?? '—'}</td>
              <td className="p-2 text-gray-500">{l.note ?? ''}</td>
            </tr>
          ))}
          {(logs ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No audit entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

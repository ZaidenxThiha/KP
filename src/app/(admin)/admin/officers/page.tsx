import { createClient } from '@/lib/supabase/server';
import { CreateOfficerForm } from '@/components/admin/CreateOfficerForm';

export const dynamic = 'force-dynamic';

export default async function AdminOfficersPage() {
  const supabase = createClient();
  const { data: officers } = await supabase
    .from('profiles')
    .select('id, username, points_balance, status, created_at')
    .eq('role', 'officer')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Officers</h1>
      <CreateOfficerForm />
      <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-3">Username</th>
            <th className="p-3">Balance</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(officers ?? []).map((o) => (
            <tr key={o.id}>
              <td className="p-3 font-medium">{o.username}</td>
              <td className="p-3">{o.points_balance.toLocaleString()}</td>
              <td className="p-3">{o.status}</td>
            </tr>
          ))}
          {(officers ?? []).length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No officers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OfficerPlayersPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();
  const { data: players } = await supabase
    .from('profiles')
    .select('id, username, points_balance, status, created_at')
    .eq('assigned_officer_id', profile!.id)
    .eq('role', 'player')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">My Players</h1>
      <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-3">Username</th>
            <th className="p-3">Balance</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(players ?? []).map((p) => (
            <tr key={p.id}>
              <td className="p-3 font-medium">{p.username}</td>
              <td className="p-3">{p.points_balance.toLocaleString()}</td>
              <td className="p-3">{p.status}</td>
            </tr>
          ))}
          {(players ?? []).length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No players yet — create one to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

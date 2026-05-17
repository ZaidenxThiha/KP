import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { DataTable } from '@/components/DataTable';

export const dynamic = 'force-dynamic';

type Player = {
  id: string;
  username: string;
  points_balance: number;
  status: string;
  created_at: string;
};

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
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-gray-900">My Players</h1>
      <DataTable<Player>
        rows={(players ?? []) as Player[]}
        rowKey={(p) => p.id}
        empty="No players yet — create one to get started."
        columns={[
          {
            header: 'Username',
            cell: (p) => <span className="font-medium text-gray-900">{p.username}</span>,
          },
          { header: 'Balance', align: 'right', cell: (p) => p.points_balance.toLocaleString() },
          {
            header: 'Status',
            cell: (p) => <span className="capitalize text-gray-500">{p.status}</span>,
          },
        ]}
      />
    </div>
  );
}

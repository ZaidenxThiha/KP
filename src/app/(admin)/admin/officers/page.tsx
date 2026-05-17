import { createClient } from '@/lib/supabase/server';
import { CreateOfficerForm } from '@/components/admin/CreateOfficerForm';
import { DataTable } from '@/components/DataTable';

export const dynamic = 'force-dynamic';

type Officer = {
  id: string;
  username: string;
  points_balance: number;
  status: string;
  created_at: string;
};

export default async function AdminOfficersPage() {
  const supabase = createClient();
  const { data: officers } = await supabase
    .from('profiles')
    .select('id, username, points_balance, status, created_at')
    .eq('role', 'officer')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-gray-900">Officers</h1>
      <CreateOfficerForm />
      <DataTable<Officer>
        rows={(officers ?? []) as Officer[]}
        rowKey={(o) => o.id}
        empty="No officers yet."
        columns={[
          {
            header: 'Username',
            cell: (o) => <span className="font-medium text-gray-900">{o.username}</span>,
          },
          { header: 'Balance', align: 'right', cell: (o) => o.points_balance.toLocaleString() },
          {
            header: 'Status',
            cell: (o) => <span className="capitalize text-gray-500">{o.status}</span>,
          },
        ]}
      />
    </div>
  );
}

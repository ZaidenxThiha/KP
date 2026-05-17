import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { GrantPointsForm } from '@/components/admin/GrantPointsForm';
import { DataTable } from '@/components/DataTable';

export const dynamic = 'force-dynamic';

type DistRow = {
  officer_id: string;
  username: string;
  given_today: number;
  given_total: number;
};

export default async function AdminDistributionPage() {
  const { data: officers } = await createClient()
    .from('profiles')
    .select('id, username, points_balance')
    .eq('role', 'officer')
    .order('username', { ascending: true });

  const balanceById = new Map(
    (officers ?? []).map((o) => [o.id as string, Number(o.points_balance ?? 0)]),
  );

  const { data: distData } = await createServiceClient()
    .from('v_officer_distribution')
    .select('*');
  const dist = (distData ?? []) as DistRow[];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-gray-900">Officer Distribution</h1>
      <GrantPointsForm officers={officers ?? []} />
      <DataTable<DistRow>
        rows={dist}
        rowKey={(d) => d.officer_id}
        empty="No officers yet."
        columns={[
          {
            header: 'Officer',
            cell: (d) => <span className="font-medium text-gray-900">{d.username}</span>,
          },
          {
            header: 'Balance',
            align: 'right',
            cell: (d) => (balanceById.get(d.officer_id) ?? 0).toLocaleString(),
          },
          {
            header: 'Given today',
            align: 'right',
            cell: (d) => Number(d.given_today).toLocaleString(),
          },
          {
            header: 'Given total',
            align: 'right',
            cell: (d) => Number(d.given_total).toLocaleString(),
          },
        ]}
      />
    </div>
  );
}

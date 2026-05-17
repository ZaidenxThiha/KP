import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { GrantPointsForm } from '@/components/admin/GrantPointsForm';

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
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Officer Distribution</h1>
      <GrantPointsForm officers={officers ?? []} />
      <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-3">Officer</th>
            <th className="p-3">Balance</th>
            <th className="p-3">Given today</th>
            <th className="p-3">Given total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {dist.map((d) => (
            <tr key={d.officer_id}>
              <td className="p-3 font-medium">{d.username}</td>
              <td className="p-3">{balanceById.get(d.officer_id)?.toLocaleString() ?? '0'}</td>
              <td className="p-3">{Number(d.given_today).toLocaleString()}</td>
              <td className="p-3">{Number(d.given_total).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

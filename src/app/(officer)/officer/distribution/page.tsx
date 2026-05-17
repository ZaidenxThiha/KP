import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OfficerDistributionPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();
  const { data: rows } = await supabase
    .from('point_transactions')
    .select('id, amount, to_user_id, note, created_at')
    .eq('user_id', profile!.id)
    .eq('transaction_type', 'officer_give_points')
    .eq('direction', 'debit')
    .order('created_at', { ascending: false })
    .limit(100);

  const total = (rows ?? []).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Distribution History</h1>
      <p className="text-sm text-gray-500">
        Total given (last 100): {total.toLocaleString()} pts
      </p>
      <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-3">When</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(rows ?? []).map((r) => (
            <tr key={r.id}>
              <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
              <td className="p-3">{r.amount.toLocaleString()}</td>
              <td className="p-3 text-gray-500">{r.note ?? '—'}</td>
            </tr>
          ))}
          {(rows ?? []).length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No distributions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { DataTable } from '@/components/DataTable';

export const dynamic = 'force-dynamic';

type Txn = {
  id: string;
  amount: number;
  to_user_id: string | null;
  note: string | null;
  created_at: string;
};

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

  const list = (rows ?? []) as Txn[];
  const total = list.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Distribution History</h1>
        <p className="mt-1 text-sm text-gray-500">
          Total given (last 100): {total.toLocaleString()} pts
        </p>
      </div>
      <DataTable<Txn>
        rows={list}
        rowKey={(r) => r.id}
        empty="No distributions yet."
        columns={[
          { header: 'When', cell: (r) => new Date(r.created_at).toLocaleString() },
          { header: 'Amount', align: 'right', cell: (r) => r.amount.toLocaleString() },
          { header: 'Note', cell: (r) => <span className="text-gray-500">{r.note ?? '—'}</span> },
        ]}
      />
    </div>
  );
}

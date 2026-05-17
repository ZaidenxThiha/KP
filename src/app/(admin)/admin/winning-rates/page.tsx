import { createClient } from '@/lib/supabase/server';
import { WinningRateForm } from '@/components/admin/WinningRateForm';
import { DataTable } from '@/components/DataTable';

export const dynamic = 'force-dynamic';

type Rate = {
  id: string;
  game_type: string;
  market: string;
  round_name: string;
  winning_rate: number;
  payout_mode: string;
  active: boolean;
  created_at: string;
};

export default async function AdminWinningRatesPage() {
  const { data: rates } = await createClient()
    .from('payout_settings')
    .select('id, game_type, market, round_name, winning_rate, payout_mode, active, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-gray-900">Winning Rates</h1>
      <WinningRateForm />
      <DataTable<Rate>
        rows={(rates ?? []) as Rate[]}
        rowKey={(r) => r.id}
        rowClassName={(r) => (r.active ? '' : 'text-gray-400')}
        empty="No winning rates set."
        columns={[
          { header: 'Game', cell: (r) => <span className="font-medium uppercase">{r.game_type}</span> },
          { header: 'Rate', cell: (r) => `${r.winning_rate}×` },
          { header: 'Mode', cell: (r) => r.payout_mode },
          { header: 'Active', cell: (r) => (r.active ? 'Yes' : '—') },
          {
            header: 'Changed',
            align: 'right',
            cell: (r) => new Date(r.created_at).toLocaleString(),
          },
        ]}
      />
    </div>
  );
}

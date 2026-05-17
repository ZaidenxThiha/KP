import { createClient } from '@/lib/supabase/server';
import { WinningRateForm } from '@/components/admin/WinningRateForm';

export const dynamic = 'force-dynamic';

export default async function AdminWinningRatesPage() {
  const { data: rates } = await createClient()
    .from('payout_settings')
    .select('id, game_type, market, round_name, winning_rate, payout_mode, active, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Winning Rates</h1>
      <WinningRateForm />
      <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-3">Game</th>
            <th className="p-3">Rate</th>
            <th className="p-3">Mode</th>
            <th className="p-3">Active</th>
            <th className="p-3">Changed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(rates ?? []).map((r) => (
            <tr key={r.id} className={r.active ? 'font-medium' : 'text-gray-400'}>
              <td className="p-3 uppercase">{r.game_type}</td>
              <td className="p-3">{r.winning_rate}×</td>
              <td className="p-3">{r.payout_mode}</td>
              <td className="p-3">{r.active ? 'yes' : '—'}</td>
              <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

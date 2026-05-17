import { createClient } from '@/lib/supabase/server';
import { NumberLimitForm } from '@/components/admin/NumberLimitForm';

export const dynamic = 'force-dynamic';

export default async function AdminNumberLimitsPage() {
  const { data: rules } = await createClient()
    .from('number_limit_rules')
    .select('id, game_type, rule_type, rule_value, max_points, active, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Number Limits</h1>
      <NumberLimitForm />
      <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-3">Game</th>
            <th className="p-3">Type</th>
            <th className="p-3">Value</th>
            <th className="p-3">Max points</th>
            <th className="p-3">Active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(rules ?? []).map((r) => (
            <tr key={r.id} className={r.active ? '' : 'text-gray-400'}>
              <td className="p-3 uppercase">{r.game_type}</td>
              <td className="p-3">{r.rule_type}</td>
              <td className="p-3 font-mono text-xs">{JSON.stringify(r.rule_value)}</td>
              <td className="p-3">{r.max_points.toLocaleString()}</td>
              <td className="p-3">{r.active ? 'yes' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

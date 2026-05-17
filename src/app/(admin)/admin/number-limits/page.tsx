import { createClient } from '@/lib/supabase/server';
import { NumberLimitForm } from '@/components/admin/NumberLimitForm';
import { DataTable } from '@/components/DataTable';

export const dynamic = 'force-dynamic';

type Rule = {
  id: string;
  game_type: string;
  rule_type: string;
  rule_value: unknown;
  max_points: number;
  active: boolean;
  created_at: string;
};

export default async function AdminNumberLimitsPage() {
  const { data: rules } = await createClient()
    .from('number_limit_rules')
    .select('id, game_type, rule_type, rule_value, max_points, active, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-gray-900">Number Limits</h1>
      <NumberLimitForm />
      <DataTable<Rule>
        rows={(rules ?? []) as Rule[]}
        rowKey={(r) => r.id}
        rowClassName={(r) => (r.active ? '' : 'text-gray-400')}
        empty="No number-limit rules."
        columns={[
          { header: 'Game', cell: (r) => <span className="font-medium uppercase">{r.game_type}</span> },
          { header: 'Type', cell: (r) => r.rule_type },
          {
            header: 'Value',
            cell: (r) => (
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">
                {JSON.stringify(r.rule_value)}
              </code>
            ),
          },
          { header: 'Max points', align: 'right', cell: (r) => r.max_points.toLocaleString() },
          { header: 'Active', cell: (r) => (r.active ? 'Yes' : '—') },
        ]}
      />
    </div>
  );
}

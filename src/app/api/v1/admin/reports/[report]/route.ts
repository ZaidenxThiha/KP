import { createServiceClient } from '@/lib/supabase/service';
import { apiError, requireApiRole } from '@/lib/api';

const VIEW: Record<string, string> = {
  dashboard: 'v_admin_dashboard_stats',
  number_exposure: 'v_number_exposure',
  officer_distribution: 'v_officer_distribution',
  winning_rate_history: 'v_winning_rate_history',
  daily_pnl: 'v_daily_pnl',
};

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => escape(r[c])).join(','))].join('\n');
}

// GET /api/v1/admin/reports/{report} — JSON, or CSV when Accept: text/csv.
export async function GET(request: Request, { params }: { params: { report: string } }) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const view = VIEW[params.report];
  if (!view) return apiError('not_found', 'Unknown report');

  const service = createServiceClient();
  const { data, error } = await service.from(view as never).select('*');
  if (error) return apiError('internal_error', error.message);
  const rows = (data ?? []) as Record<string, unknown>[];

  if (request.headers.get('accept')?.includes('text/csv')) {
    return new Response(toCsv(rows), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${params.report}.csv"`,
      },
    });
  }
  return Response.json({ report: params.report, rows });
}

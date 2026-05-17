'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';

const REPORTS = [
  'dashboard',
  'number_exposure',
  'officer_distribution',
  'winning_rate_history',
  'daily_pnl',
];

const INPUT =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';
const BTN_GHOST =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50';

type Row = Record<string, unknown>;

export function ReportsView() {
  const [report, setReport] = useState('dashboard');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/admin/reports/${report}`);
    const data = await res.json();
    setRows(res.ok ? (data.rows ?? []) : []);
    setLoading(false);
  }, [report]);

  useEffect(() => {
    load();
  }, [load]);

  const cols = rows[0] ? Object.keys(rows[0]) : [];

  // CSV download needs the Accept header, so fetch + blob rather than a link.
  function downloadCsv() {
    fetch(`/api/v1/admin/reports/${report}`, { headers: { Accept: 'text/csv' } })
      .then((r) => r.blob())
      .then((b) => {
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={report} onChange={(e) => setReport(e.target.value)} className={INPUT}>
          {REPORTS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button onClick={downloadCsv} className={BTN_GHOST}>
          Download CSV
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <DataTable<Row>
          rows={rows}
          empty="No data."
          columns={cols.map((c) => ({
            header: c,
            cell: (row: Row) => String(row[c] ?? ''),
          }))}
        />
      )}
    </div>
  );
}

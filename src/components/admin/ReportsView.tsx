'use client';

import { useCallback, useEffect, useState } from 'react';

const REPORTS = [
  'dashboard',
  'number_exposure',
  'officer_distribution',
  'winning_rate_history',
  'daily_pnl',
];

export function ReportsView() {
  const [report, setReport] = useState('dashboard');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <select
          value={report}
          onChange={(e) => setReport(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {REPORTS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <a
          href={`/api/v1/admin/reports/${report}`}
          className="text-sm text-accent underline"
          // CSV download requires the Accept header; fetch + blob keeps it simple.
          onClick={(e) => {
            e.preventDefault();
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
          }}
        >
          Download CSV
        </a>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No data.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              {cols.map((c) => (
                <th key={c} className="p-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c} className="p-2">
                    {String(row[c] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { t } from '@/lib/strings';

// Live 2D results from api.thaistock2d.com via the /api/v1/results/live proxy:
// the current 2D number, then the four daily draws (11:00 / 12:01 / 15:00 /
// 16:30) as a table. Polled every 15s. Shared by the home and results screens.

type Draw = { open_time?: string; set?: string; value?: string; twod?: string };
type Live = {
  server_time?: string;
  live?: { set?: string; value?: string; twod?: string; time?: string };
  result?: Draw[];
};

const TIME_LABEL: Record<string, string> = {
  '11:00:00': '11:00 AM',
  '12:01:00': '12:01 PM',
  '15:00:00': '03:00 PM',
  '16:30:00': '04:30 PM',
};

// "16:30:00" -> "04:30 PM" (fallback for any unexpected draw time)
function to12h(time: string): string {
  const [hStr, m = '00'] = time.split(':');
  const h = Number(hStr) || 0;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
}

// Set / Value with their last two digits highlighted — the digits the 2D is
// drawn from.
function Tail({ value }: { value?: string }) {
  if (!value || value === '--') return <>{value || '--'}</>;
  return (
    <>
      {value.slice(0, -2)}
      <span className="text-amber-500">{value.slice(-2)}</span>
    </>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export function LiveResults() {
  const [data, setData] = useState<Live | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch('/api/v1/results/live', { cache: 'no-store' });
        if (!res.ok) {
          if (alive) setFailed(true);
          return;
        }
        const json = (await res.json()) as Live;
        if (alive) {
          setData(json);
          setFailed(false);
        }
      } catch {
        if (alive) setFailed(true);
      }
    }
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const live = data?.live;
  const draws = data?.result ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="text-center">
        <p className="text-8xl font-black leading-none tracking-tight text-brand">
          {live?.twod ?? '--'}
        </p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-gray-400">
          <RefreshIcon />
          {t.home.updated} {data?.server_time ?? '—'}
        </p>
      </div>

      {!data ? (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-base text-gray-400">
          {failed ? t.errors.generic : t.loading}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-brand text-sm text-white">
                <th className="px-3 py-2.5 text-left font-semibold">Time</th>
                <th className="px-2 py-2.5 text-right font-semibold">Set</th>
                <th className="px-2 py-2.5 text-right font-semibold">Value</th>
                <th className="px-3 py-2.5 text-right font-semibold">2D</th>
              </tr>
            </thead>
            <tbody>
              {draws.map((d, i) => (
                <tr key={d.open_time || i} className={i % 2 === 0 ? 'bg-cyan-50' : 'bg-emerald-50'}>
                  <td className="px-3 py-3 font-semibold text-brand">
                    {TIME_LABEL[d.open_time ?? ''] ?? to12h(d.open_time ?? '')}
                  </td>
                  <td className="px-2 py-3 text-right font-medium text-gray-500">
                    <Tail value={d.set} />
                  </td>
                  <td className="px-2 py-3 text-right font-medium text-gray-500">
                    <Tail value={d.value} />
                  </td>
                  <td className="px-3 py-3 text-right text-lg font-bold text-brand">
                    {d.twod || '--'}
                  </td>
                </tr>
              ))}
              {draws.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-base text-gray-400">
                    {t.home.noResults}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';

// Live 2D results from api.thaistock2d.com (via our /api/v1/results/live proxy):
// a big current 2D number on top, then a card per draw — polled every 15s.

type Draw = { open_time?: string; set?: string; value?: string; twod?: string };
type Live = {
  server_time?: string;
  live?: { set?: string; value?: string; twod?: string; time?: string };
  result?: Draw[];
};

// The four daily draws, labelled to match the game's round schedule.
const TIME_LABEL: Record<string, string> = {
  '11:00:00': '11:00 AM',
  '12:00:00': '12:01 PM',
  '15:00:00': '03:00 PM',
  '16:30:00': '04:30 PM',
};

// "16:30:00" -> "04:30 PM" (fallback for any unexpected draw time)
function to12h(t: string): string {
  const [hStr, m = '00'] = t.split(':');
  const h = Number(hStr) || 0;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
}

export default function ResultsPage() {
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
    <div className="flex flex-col gap-5">
      {/* Big live 2D number */}
      <div className="pt-1 text-center">
        <p className="text-8xl font-black leading-none tracking-tight text-gray-900 drop-shadow-md">
          {live?.twod ?? '--'}
        </p>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-500">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v5h-5" />
          </svg>
          Updated: {data?.server_time ?? '—'}
        </p>
      </div>

      {!data && (
        <p className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          {failed ? 'Results are temporarily unavailable.' : 'Loading live results…'}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {draws.map((d, i) => (
          <div
            key={d.open_time || i}
            className={`rounded-2xl px-5 py-4 ${i % 2 === 0 ? 'bg-blue-500' : 'bg-blue-700'}`}
          >
            <p className="text-center text-lg font-bold text-white">
              {TIME_LABEL[d.open_time ?? ''] ?? to12h(d.open_time ?? '')}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-white/25 pt-3">
              <div className="text-center">
                <p className="text-xs text-white/70">Set</p>
                <p className="font-bold text-white">{d.set || '--'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/70">Value</p>
                <p className="font-bold text-white">{d.value || '--'}</p>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <div className="text-center">
                  <p className="text-xs text-white/70">2D</p>
                  <p className="text-xl font-bold text-yellow-300">{d.twod || '--'}</p>
                </div>
                <span className="text-white/50">›</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

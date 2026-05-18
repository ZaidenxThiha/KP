'use client';

import { all2d } from '@/lib/bet-types';

type Avail = Record<string, { used: number; max: number | null }>;

// The 00–99 number grid. Each tile carries a fill bar: green = room,
// amber = filling up, red = full. A number whose limit is already met by
// other players' bets is disabled.
export function NumberGrid({
  availability,
  selection,
  onToggle,
}: {
  availability: Avail;
  selection: Record<string, number>;
  onToggle: (n: string) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {all2d().map((n) => {
        const av = availability[n];
        const selected = selection[n] != null;
        const serverUsed = av?.used ?? 0;
        const max = av?.max ?? null;
        const full = max != null && serverUsed >= max;
        const used = serverUsed + (selection[n] ?? 0);
        const ratio = max != null && max > 0 ? Math.min(used / max, 1) : 0;

        let fill = 'bg-green-500';
        if (max != null) {
          if (ratio >= 1) fill = 'bg-red-500';
          else if (ratio >= 0.7) fill = 'bg-amber-500';
        }
        const widthPct = max != null ? Math.max(ratio * 100, 6) : 100;

        return (
          <button
            key={n}
            type="button"
            disabled={full && !selected}
            onClick={() => onToggle(n)}
            className={`flex flex-col items-center gap-1 rounded-md border px-0.5 py-1.5 transition ${
              selected
                ? 'border-brand bg-brand text-brand-fg'
                : full
                  ? 'border-gray-200 bg-gray-100 text-gray-300'
                  : 'border-gray-200 bg-gray-50 text-gray-700 active:scale-95'
            }`}
          >
            <span className="text-base font-bold">{n}</span>
            <span
              className={`h-1 w-full overflow-hidden rounded-full ${
                selected ? 'bg-white/30' : 'bg-gray-200'
              }`}
            >
              <span
                className={`block h-full ${selected ? 'bg-white' : fill}`}
                style={{ width: `${widthPct}%` }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}

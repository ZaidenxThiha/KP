'use client';

import { mmDate, mmTime } from '@/lib/datetime';
import { t } from '@/lib/strings';

type Round = {
  id: string;
  game_type: string;
  round_name: string;
  close_time: string;
};

// Round-selection modal shown when the betting flow opens without a preset
// round. Mirrors the mockup's "choose a time" sheet.
export function RoundPicker({
  rounds,
  selectedId,
  onSelect,
  onConfirm,
  onClose,
}: {
  rounds: Round[];
  selectedId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-bold leading-snug text-brand">{t.picker.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="-mr-1 -mt-1 shrink-0 p-1 text-lg leading-none text-gray-400"
          >
            ✕
          </button>
        </div>

        {rounds.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">{t.picker.noRounds}</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {rounds.map((r) => {
              const active = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition ${
                    active
                      ? 'border-brand bg-white text-brand'
                      : 'border-transparent bg-gray-100 text-gray-600'
                  }`}
                >
                  <span className="flex flex-col text-left">
                    <span className="font-bold uppercase">
                      {r.game_type} · {r.round_name}
                    </span>
                    <span className="text-[11px] font-normal text-gray-400">
                      {mmDate(r.close_time)}
                    </span>
                  </span>
                  <span className="text-xs">
                    {t.closeTime} {mmTime(r.close_time)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedId}
          className="mt-4 w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-brand-fg disabled:opacity-50"
        >
          {t.picker.confirm}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { t } from '@/lib/strings';
import { boxPermutations, byHeadDigit, byTailDigit, evens, odds, twins } from '@/lib/bet-types';

const OVERLAY = 'fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6';
const CARD = 'w-full max-w-sm rounded-2xl bg-white p-5';

// "ခွေ" — enter a string of digits, bet every 2-digit pair formed from them.
export function BoxModal({
  onAdd,
  onClose,
}: {
  onAdd: (nums: string[]) => void;
  onClose: () => void;
}) {
  const [digits, setDigits] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const preview = boxPermutations(digits);

  function confirm() {
    if (preview.length === 0) {
      setErr(t.box.empty);
      return;
    }
    onAdd(preview);
    onClose();
  }

  return (
    <div className={OVERLAY} onClick={onClose}>
      <div className={CARD} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-brand">{t.box.title}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{t.box.desc}</p>
        <input
          inputMode="numeric"
          value={digits}
          onChange={(e) => {
            setDigits(e.target.value.replace(/[^0-9]/g, '').slice(0, 10));
            setErr(null);
          }}
          placeholder={t.box.placeholder}
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-lg font-bold tracking-[0.3em] text-gray-900 outline-none focus:border-brand"
        />
        {preview.length > 0 && (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            {preview.length} — {preview.join(', ')}
          </p>
        )}
        {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-600"
          >
            {t.box.cancel}
          </button>
          <button
            type="button"
            onClick={confirm}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-bold text-brand-fg"
          >
            {t.box.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

// "အမြန်ရွေး" — preset groups: twins, evens, odds, and by head / tail digit.
export function QuickPickModal({
  onAdd,
  onClose,
}: {
  onAdd: (nums: string[]) => void;
  onClose: () => void;
}) {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const presetBtn = 'rounded-lg border border-brand bg-white py-2 text-xs font-bold text-brand';
  const digitBtn =
    'rounded-md bg-gray-100 py-2 text-sm font-bold text-gray-700 transition active:bg-brand active:text-brand-fg';

  function pick(nums: string[]) {
    onAdd(nums);
    onClose();
  }

  return (
    <div className={OVERLAY} onClick={onClose}>
      <div className={CARD} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-brand">{t.quick.title}</h2>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => pick(twins())} className={presetBtn}>
            {t.quick.twins}
          </button>
          <button type="button" onClick={() => pick(evens())} className={presetBtn}>
            {t.quick.even}
          </button>
          <button type="button" onClick={() => pick(odds())} className={presetBtn}>
            {t.quick.odd}
          </button>
        </div>

        <p className="mt-4 text-xs font-medium text-gray-500">{t.quick.head}</p>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {digits.map((d) => (
            <button key={d} type="button" onClick={() => pick(byHeadDigit(d))} className={digitBtn}>
              {d}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs font-medium text-gray-500">{t.quick.tail}</p>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {digits.map((d) => (
            <button key={d} type="button" onClick={() => pick(byTailDigit(d))} className={digitBtn}>
              {d}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-600"
        >
          {t.box.cancel}
        </button>
      </div>
    </div>
  );
}

'use client';

import { t } from '@/lib/strings';

type Item = { number: string; points: number };

// The bet cart — the selected numbers with editable stakes, a running total
// and the resulting balance, then place-all.
export function BetCart({
  items,
  balance,
  placing,
  notice,
  onChangeAmount,
  onRemove,
  onBack,
  onSubmit,
}: {
  items: Item[];
  balance: number | null;
  placing: boolean;
  notice: string | null;
  onChangeAmount: (number: string, points: number) => void;
  onRemove: (number: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const total = items.reduce((s, it) => s + it.points, 0);
  const allPositive = items.length > 0 && items.every((it) => it.points > 0);
  const overBalance = balance != null && total > balance;
  const canSubmit = allPositive && !overBalance && !placing;

  return (
    <div className="flex flex-col gap-3 pb-24">
      <h1 className="text-base font-bold text-brand">{t.cart.title}</h1>

      {items.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
          {t.cart.empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand text-xs text-white">
                <th className="px-3 py-2.5 text-left font-semibold">{t.cart.no}</th>
                <th className="px-2 py-2.5 text-center font-semibold">{t.cart.number}</th>
                <th className="px-2 py-2.5 text-right font-semibold">{t.cart.amount}</th>
                <th className="w-9 px-2 py-2.5 font-semibold" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.number} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-2 py-2.5 text-center text-base font-bold tracking-wider text-gray-900">
                    {it.number}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <input
                      inputMode="numeric"
                      value={it.points}
                      onChange={(e) =>
                        onChangeAmount(
                          it.number,
                          Math.floor(Number(e.target.value.replace(/[^0-9]/g, '')) || 0),
                        )
                      }
                      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:border-brand"
                    />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(it.number)}
                      aria-label={t.cart.remove}
                      className="text-base leading-none text-red-500"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 bg-gray-50 font-bold text-gray-900">
                <td colSpan={2} className="px-3 py-2.5 text-sm">
                  {t.cart.total}
                </td>
                <td colSpan={2} className="px-3 py-2.5 text-right text-sm">
                  {total.toLocaleString()} {t.kyat}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">{t.balance}</span>
          <span className="font-semibold text-gray-900">
            {balance != null ? balance.toLocaleString() : '—'} {t.kyat}
          </span>
        </div>
        {balance != null && (
          <div className="mt-1 flex justify-between">
            <span className="text-gray-500">{t.cart.balanceAfter}</span>
            <span className={`font-semibold ${overBalance ? 'text-red-600' : 'text-green-600'}`}>
              {(balance - total).toLocaleString()} {t.kyat}
            </span>
          </div>
        )}
      </div>

      {overBalance && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {t.cart.insufficientTotal}
        </p>
      )}
      {notice && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{notice}</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md gap-2.5 border-t border-gray-200 bg-white px-4 py-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onBack}
          disabled={placing}
          className="flex-1 rounded-lg border border-brand py-3 text-sm font-bold text-brand disabled:opacity-50"
        >
          {t.cart.reselect}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-[1.4] rounded-lg bg-brand py-3 text-sm font-bold text-brand-fg disabled:opacity-50"
        >
          {placing ? t.cart.placing : `${t.cart.submit} (${items.length})`}
        </button>
      </div>
    </div>
  );
}

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { errorText, t } from '@/lib/strings';
import { mmDate, mmTime, roundLabel } from '@/lib/datetime';
import { RoundPicker } from '@/components/player/RoundPicker';
import { NumberGrid } from '@/components/player/NumberGrid';
import { BetCart } from '@/components/player/BetCart';
import { BoxModal, QuickPickModal } from '@/components/player/BetTypeModals';

type Round = {
  id: string;
  game_type: '2d' | '3d';
  round_name: string;
  close_time: string;
  status: string;
};
type Avail = Record<string, { used: number; max: number | null }>;
type BatchResult = { number: string; ok: boolean };

const BTN_TYPE =
  'rounded-lg border border-brand bg-white py-2 text-sm font-bold text-brand transition active:bg-brand active:text-brand-fg';

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function BackIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function GuessFlow() {
  const params = useSearchParams();
  const router = useRouter();

  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundId, setRoundId] = useState('');
  const [pickerId, setPickerId] = useState('');
  const [view, setView] = useState<'loading' | 'picker' | 'grid' | 'cart'>('loading');
  const [amount, setAmount] = useState('100');
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [availability, setAvailability] = useState<Avail>({});
  const [balance, setBalance] = useState<number | null>(null);
  const [threeD, setThreeD] = useState('');
  const [boxOpen, setBoxOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const round = rounds.find((r) => r.id === roundId) ?? null;

  useEffect(() => {
    fetch('/api/v1/player/balance')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.balance === 'number') setBalance(d.balance);
      })
      .catch(() => {});

    fetch('/api/v1/rounds/today')
      .then((r) => r.json())
      .then((d) => {
        const open: Round[] = (d.rounds ?? []).filter((r: Round) => r.status === 'open');
        setRounds(open);
        const preset = params.get('round');
        if (preset && open.some((r) => r.id === preset)) {
          setRoundId(preset);
        } else if (open.length > 0) {
          setRoundId(open[0].id);
        }
        // Drop straight into the number grid with a round preselected — the
        // player taps "change round" to pick another. Only show the picker
        // first when there is no open round at all.
        setView(open.length > 0 ? 'grid' : 'picker');
      })
      .catch(() => {
        setNotice(t.errors.loadRounds);
        setView('picker');
      });
  }, [params]);

  const loadAvailability = useCallback(async (rid: string) => {
    try {
      const res = await fetch(`/api/v1/rounds/availability?round_id=${rid}`);
      const d = await res.json();
      const map: Avail = {};
      for (const n of d.numbers ?? []) map[n.number] = { used: n.used, max: n.max };
      setAvailability(map);
    } catch {
      setNotice(t.errors.loadGrid);
    }
  }, []);

  useEffect(() => {
    if (roundId && view === 'grid') loadAvailability(roundId);
  }, [roundId, view, loadAvailability]);

  const items = Object.keys(selection)
    .sort()
    .map((number) => ({ number, points: selection[number] }));
  const count = items.length;

  function toggleNumber(num: string) {
    setNotice(null);
    setSelection((prev) => {
      if (prev[num] != null) {
        const next = { ...prev };
        delete next[num];
        return next;
      }
      const amt = Math.floor(Number(amount));
      if (!Number.isFinite(amt) || amt <= 0) {
        setNotice(t.bet.amountFirst);
        return prev;
      }
      return { ...prev, [num]: amt };
    });
  }

  function addNumbers(nums: string[]) {
    const amt = Math.floor(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) {
      setNotice(t.bet.amountFirst);
      return;
    }
    setSelection((prev) => {
      const next = { ...prev };
      for (const n of nums) if (next[n] == null) next[n] = amt;
      return next;
    });
    setNotice(null);
  }

  function addReverse() {
    const keys = Object.keys(selection);
    if (keys.length === 0) {
      setNotice(t.bet.selectFirst);
      return;
    }
    setSelection((prev) => {
      const next = { ...prev };
      for (const n of keys) {
        const rev = n.split('').reverse().join('');
        if (next[rev] == null) next[rev] = prev[n];
      }
      return next;
    });
    setNotice(t.bet.reverseDone);
  }

  function clearAll() {
    setSelection({});
    setNotice(null);
  }

  function confirmPicker() {
    if (!pickerId) return;
    setRoundId(pickerId);
    setSelection({});
    setNotice(null);
    setView('grid');
  }

  function goToCart() {
    if (count === 0) {
      setNotice(t.bet.selectFirst);
      return;
    }
    setNotice(null);
    setView('cart');
  }

  async function placeBets() {
    if (count === 0) return;
    setPlacing(true);
    setNotice(null);
    try {
      const res = await fetch('/api/v1/guesses/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: roundId, items }),
      });
      const d = await res.json();
      if (!res.ok) {
        setNotice(errorText(d.error?.code));
        setPlacing(false);
        return;
      }
      const results = (d.results ?? []) as BatchResult[];
      const failed = results.filter((r) => !r.ok).map((r) => r.number);
      if (typeof d.remaining_balance === 'number') setBalance(d.remaining_balance);
      router.refresh();
      if (failed.length === 0) {
        router.push('/history');
        return;
      }
      setSelection((prev) => {
        const next: Record<string, number> = {};
        for (const n of failed) if (prev[n] != null) next[n] = prev[n];
        return next;
      });
      setNotice(t.cart.someFailed);
      setView('grid');
      loadAvailability(roundId);
    } catch {
      setNotice(t.errors.generic);
    }
    setPlacing(false);
  }

  if (view === 'loading') {
    return <p className="py-12 text-center text-base text-gray-400">{t.loading}</p>;
  }

  if (view === 'picker') {
    return (
      <RoundPicker
        rounds={rounds}
        selectedId={pickerId}
        onSelect={setPickerId}
        onConfirm={confirmPicker}
        onClose={() => {
          if (roundId) setView('grid');
          else router.push('/');
        }}
      />
    );
  }

  if (view === 'cart') {
    return (
      <BetCart
        items={items}
        balance={balance}
        placing={placing}
        notice={notice}
        onChangeAmount={(number, points) =>
          setSelection((prev) => ({ ...prev, [number]: points }))
        }
        onRemove={(number) =>
          setSelection((prev) => {
            const next = { ...prev };
            delete next[number];
            return next;
          })
        }
        onBack={() => {
          setNotice(null);
          setView('grid');
        }}
        onSubmit={placeBets}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 pb-24">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            aria-label={t.back}
            className="-ml-1.5 rounded-lg p-1.5 text-gray-600 active:bg-gray-100"
          >
            <BackIcon />
          </button>
          <h1 className="text-lg font-bold text-gray-900">{t.nav.bet}</h1>
          {round && (
            <span className="ml-auto text-sm font-bold text-brand">
              {t.closeTime} {mmTime(round.close_time)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
          <p className="text-base">
            <span className="font-bold uppercase text-brand">
              {round ? roundLabel(round.round_name) : '—'}
            </span>
            {round && (
              <span className="ml-2 text-sm text-gray-400">{mmDate(round.close_time)}</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setPickerId(roundId);
              setView('picker');
            }}
            className="text-sm font-semibold text-brand"
          >
            {t.bet.changeRound}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setBoxOpen(true)} className={BTN_TYPE}>
            {t.bet.box}
          </button>
          <button type="button" onClick={() => setQuickOpen(true)} className={BTN_TYPE}>
            {t.bet.quick}
          </button>
          <button type="button" onClick={addReverse} className={BTN_TYPE}>
            {t.bet.reverse}
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">{t.bet.amount}</label>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={t.bet.amountPlaceholder}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base font-semibold text-gray-900 outline-none focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <Legend color="bg-green-500" label={t.bet.legendOpen} />
          <Legend color="bg-amber-500" label={t.bet.legendMid} />
          <Legend color="bg-red-500" label={t.bet.legendFull} />
        </div>

        {round?.game_type === '3d' ? (
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              value={threeD}
              onChange={(e) => setThreeD(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder="000"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-center text-xl font-bold tracking-[0.3em] text-gray-900 outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={() => {
                if (threeD.length === 3) {
                  addNumbers([threeD]);
                  setThreeD('');
                }
              }}
              className="rounded-lg bg-brand px-5 text-base font-bold text-brand-fg"
            >
              {t.box.confirm}
            </button>
          </div>
        ) : (
          <NumberGrid availability={availability} selection={selection} onToggle={toggleNumber} />
        )}

        {notice && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-base text-amber-700">{notice}</p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md gap-2.5 border-t border-gray-200 bg-white px-4 py-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={clearAll}
          className="flex-1 rounded-lg border border-gray-300 py-3 text-base font-bold text-gray-600"
        >
          {t.bet.clear}
        </button>
        <button
          type="button"
          onClick={goToCart}
          disabled={count === 0}
          className="flex-[1.4] rounded-lg bg-brand py-3 text-base font-bold text-brand-fg disabled:opacity-50"
        >
          {t.bet.continue} ({count})
        </button>
      </div>

      {boxOpen && <BoxModal onAdd={addNumbers} onClose={() => setBoxOpen(false)} />}
      {quickOpen && <QuickPickModal onAdd={addNumbers} onClose={() => setQuickOpen(false)} />}
    </>
  );
}

export default function GuessPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-base text-gray-400">{t.loading}</p>}>
      <GuessFlow />
    </Suspense>
  );
}

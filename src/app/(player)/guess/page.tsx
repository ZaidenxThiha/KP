'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Round = {
  id: string;
  game_type: '2d' | '3d';
  round_name: string;
  close_time: string;
  status: string;
  rate: { winning_rate: number; payout_mode: string } | null;
};

const INPUT =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';

function GuessForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundId, setRoundId] = useState('');
  const [guessNumber, setGuessNumber] = useState('');
  const [points, setPoints] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/v1/rounds/today')
      .then((r) => r.json())
      .then((d) => {
        const open: Round[] = (d.rounds ?? []).filter((r: Round) => r.status === 'open');
        setRounds(open);
        const preset = params.get('round');
        setRoundId(preset && open.some((r) => r.id === preset) ? preset : (open[0]?.id ?? ''));
      })
      .catch(() => setMessage({ kind: 'err', text: 'Could not load rounds.' }));
  }, [params]);

  const round = rounds.find((r) => r.id === roundId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/v1/guesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round_id: roundId,
        guess_number: guessNumber,
        points_used: Number(points),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({
        kind: 'ok',
        text: `Guess placed. Possible win: ${data.possible_win_amount.toLocaleString()} pts. Balance: ${data.remaining_balance.toLocaleString()} pts.`,
      });
      setGuessNumber('');
      setPoints('');
      router.refresh(); // re-render server components so the header balance updates
    } else {
      const remaining = data.error?.details?.remaining_max;
      setMessage({
        kind: 'err',
        text:
          data.error?.code === 'partial_room'
            ? `Only ${remaining} pts of room left on that number.`
            : data.error?.code === 'number_full'
              ? 'That number is full.'
              : (data.error?.message ?? 'Could not place guess.'),
      });
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-gray-900">Place a Guess</h1>
      {rounds.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No open rounds right now.
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4"
        >
          <label className="text-xs font-medium text-gray-500">
            Round
            <select value={roundId} onChange={(e) => setRoundId(e.target.value)} className={INPUT}>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.game_type.toUpperCase()} · {r.round_name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-xs font-medium text-gray-500">
              Your number ({round?.game_type === '3d' ? '3 digits' : '2 digits'})
            </p>
            <input
              inputMode="numeric"
              value={guessNumber}
              onChange={(e) => setGuessNumber(e.target.value)}
              maxLength={3}
              required
              placeholder={round?.game_type === '3d' ? '000' : '00'}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-center text-3xl font-bold tracking-[0.3em] text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <label className="text-xs font-medium text-gray-500">
            Points to stake
            <input
              inputMode="numeric"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
              className={INPUT}
            />
          </label>

          {round?.rate && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-500">Rate {round.rate.winning_rate}×</span>
              {Number(points) > 0 && (
                <span className="font-semibold text-gray-900">
                  Win {Math.round(Number(points) * round.rate.winning_rate).toLocaleString()} pts
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !roundId}
            className="rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50"
          >
            {busy ? 'Placing…' : 'Submit guess'}
          </button>
        </form>
      )}
      {message && (
        <p
          className={`rounded-lg border p-3 text-sm ${
            message.kind === 'ok'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

export default function GuessPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
      <GuessForm />
    </Suspense>
  );
}

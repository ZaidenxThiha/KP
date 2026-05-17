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
      <h1 className="text-lg font-bold">Place a Guess</h1>
      {rounds.length === 0 ? (
        <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">No open rounds.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-sm font-medium">
            Round
            <select
              value={roundId}
              onChange={(e) => setRoundId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.game_type.toUpperCase()} · {r.round_name}
                </option>
              ))}
            </select>
          </label>
          {round?.rate && (
            <p className="text-xs text-gray-500">
              Winning rate: {round.rate.winning_rate}× ({round.rate.payout_mode})
            </p>
          )}
          <label className="text-sm font-medium">
            Number ({round?.game_type === '3d' ? '3 digits' : '2 digits'})
            <input
              inputMode="numeric"
              value={guessNumber}
              onChange={(e) => setGuessNumber(e.target.value)}
              maxLength={3}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-lg tracking-widest"
            />
          </label>
          <label className="text-sm font-medium">
            Points
            <input
              inputMode="numeric"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          {round?.rate && Number(points) > 0 && (
            <p className="text-xs text-gray-500">
              Possible win: {Math.round(Number(points) * round.rate.winning_rate).toLocaleString()}{' '}
              pts
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !roundId}
            className="rounded-md bg-accent px-4 py-2.5 font-medium text-accent-fg disabled:opacity-60"
          >
            {busy ? 'Placing…' : 'Submit guess'}
          </button>
        </form>
      )}
      {message && (
        <p
          className={`rounded-md p-3 text-sm ${
            message.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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

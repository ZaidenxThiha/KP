'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';
const BTN =
  'rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50';

export function WinningRateForm() {
  const router = useRouter();
  const [gameType, setGameType] = useState('2d');
  const [rate, setRate] = useState('80');
  const [mode, setMode] = useState('multiplier_only');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/v1/admin/winning-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        market: 'all',
        round_name: 'all',
        winning_rate: Number(rate),
        payout_mode: mode,
        apply_to: 'future_rounds',
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ kind: 'ok', text: 'Winning rate updated.' });
      router.refresh();
    } else {
      setMessage({ kind: 'err', text: data.error?.message ?? 'Failed.' });
    }
    setBusy(false);
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-gray-900">Set winning rate</h2>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Game
        <select value={gameType} onChange={(e) => setGameType(e.target.value)} className={INPUT}>
          <option value="2d">2D</option>
          <option value="3d">3D</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Winning rate (multiplier)
        <input
          inputMode="decimal"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          required
          className={INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Payout mode
        <select value={mode} onChange={(e) => setMode(e.target.value)} className={INPUT}>
          <option value="multiplier_only">Multiplier only</option>
          <option value="multiplier_plus_stake">Multiplier plus stake</option>
        </select>
      </label>
      <button type="submit" disabled={busy} className={BTN}>
        {busy ? 'Saving…' : 'Save rate'}
      </button>
      {message && (
        <p className={`text-sm ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}

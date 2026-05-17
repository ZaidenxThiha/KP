'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <form onSubmit={submit} className="flex max-w-md flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <h2 className="font-semibold">Set Winning Rate</h2>
      <div className="flex gap-3">
        <select
          value={gameType}
          onChange={(e) => setGameType(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="2d">2D</option>
          <option value="3d">3D</option>
        </select>
        <input
          inputMode="decimal"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          required
          className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="multiplier_only">multiplier_only</option>
          <option value="multiplier_plus_stake">multiplier_plus_stake</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
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

'use client';

import { useEffect, useState } from 'react';

type Player = { id: string; username: string; points_balance: number; status: string };

const INPUT =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';

export default function PlayerPointsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'give' | 'remove'>('give');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function loadPlayers() {
    fetch('/api/v1/officer/players')
      .then((r) => r.json())
      .then((d) => {
        setPlayers(d.players ?? []);
        setPlayerId((prev) => prev || (d.players?.[0]?.id ?? ''));
      });
  }
  useEffect(loadPlayers, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/v1/officer/points/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, amount: Number(amount), note: note || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({
        kind: 'ok',
        text: `Done. Player balance: ${data.player_balance.toLocaleString()} pts.`,
      });
      setAmount('');
      setNote('');
      loadPlayers();
    } else {
      setMessage({ kind: 'err', text: data.error?.message ?? 'Failed.' });
    }
    setBusy(false);
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold text-gray-900">Player Points</h1>

      {/* Give / Remove segmented control */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
        {(['give', 'remove'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
              mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <label className="text-xs font-medium text-gray-500">
          Player
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className={INPUT}>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.username} ({p.points_balance.toLocaleString()} pts)
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-500">
          Amount
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className={INPUT}
          />
        </label>
        <label className="text-xs font-medium text-gray-500">
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} className={INPUT} />
        </label>
        <button
          type="submit"
          disabled={busy || !playerId}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50"
        >
          {busy ? 'Working…' : mode === 'remove' ? 'Remove points' : 'Give points'}
        </button>
      </form>
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

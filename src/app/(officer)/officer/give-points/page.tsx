'use client';

import { useEffect, useState } from 'react';

type Player = { id: string; username: string; points_balance: number; status: string };

export default function GivePointsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
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
    const res = await fetch('/api/v1/officer/points/give', {
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
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-bold">Give Points</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm font-medium">
          Player
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.username} ({p.points_balance.toLocaleString()} pts)
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Amount
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Note (optional)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !playerId}
          className="rounded-md bg-accent px-4 py-2.5 font-medium text-accent-fg disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Give points'}
        </button>
      </form>
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

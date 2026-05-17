'use client';

import { useState } from 'react';

type Created = { player_id: string; username: string; password: string; balance: number };

export default function CreatePlayerPage() {
  const [withBonus, setWithBonus] = useState(true);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState('');

  async function create() {
    setBusy(true);
    setError('');
    setCreated(null);
    const res = await fetch('/api/v1/officer/players/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ welcome_bonus: withBonus }),
    });
    const data = await res.json();
    if (res.ok) setCreated(data);
    else setError(data.error?.message ?? 'Could not create player.');
    setBusy(false);
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-bold">Create Player</h1>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={withBonus}
          onChange={(e) => setWithBonus(e.target.checked)}
        />
        Grant the welcome bonus
      </label>
      <button
        onClick={create}
        disabled={busy}
        className="rounded-md bg-accent px-4 py-2.5 font-medium text-accent-fg disabled:opacity-60"
      >
        {busy ? 'Creating…' : 'Create player'}
      </button>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {created && (
        <div className="rounded-md border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Save these credentials now — the password will not be shown again.
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Username</dt>
              <dd className="font-mono font-bold">{created.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Password</dt>
              <dd className="font-mono font-bold">{created.password}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Starting balance</dt>
              <dd className="font-medium">{created.balance.toLocaleString()} pts</dd>
            </div>
          </dl>
          <button
            onClick={() =>
              navigator.clipboard?.writeText(
                `Username: ${created.username}\nPassword: ${created.password}`,
              )
            }
            className="mt-3 rounded-md border border-amber-400 px-3 py-1.5 text-sm font-medium text-amber-800"
          >
            Copy credentials
          </button>
        </div>
      )}
    </div>
  );
}

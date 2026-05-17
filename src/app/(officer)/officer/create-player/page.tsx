'use client';

import { useState } from 'react';

type Created = { player_id: string; username: string; password: string; balance: number };

const BTN =
  'rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50';

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
    <div className="flex w-full max-w-md flex-col gap-4">
      <h1 className="text-lg font-semibold text-gray-900">Create Player</h1>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={withBonus}
            onChange={(e) => setWithBonus(e.target.checked)}
            className="h-4 w-4 accent-[#4f46e5]"
          />
          Grant the welcome bonus
        </label>
        <button onClick={create} disabled={busy} className={BTN}>
          {busy ? 'Creating…' : 'Create player'}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {created && (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-300 bg-white p-4">
          <div className="flex items-start gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0 text-gray-400"
            >
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <p className="text-sm font-medium text-gray-900">
              Save these credentials now — the password is shown only once.
            </p>
          </div>
          <dl className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Username</dt>
              <dd className="font-mono font-semibold text-gray-900">{created.username}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Password</dt>
              <dd className="font-mono font-semibold text-gray-900">{created.password}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Starting balance</dt>
              <dd className="font-medium text-gray-900">{created.balance.toLocaleString()} pts</dd>
            </div>
          </dl>
          <button
            onClick={() =>
              navigator.clipboard?.writeText(
                `Username: ${created.username}\nPassword: ${created.password}`,
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Copy credentials
          </button>
        </div>
      )}
    </div>
  );
}

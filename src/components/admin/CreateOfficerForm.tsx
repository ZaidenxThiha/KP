'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';
const BTN =
  'rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50';

export function CreateOfficerForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/v1/admin/officers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ kind: 'ok', text: `Officer ${username} created.` });
      setUsername('');
      setPassword('');
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
      <h2 className="text-sm font-semibold text-gray-900">Create officer</h2>
      <input
        placeholder="Username (min 3 chars)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        minLength={3}
        maxLength={40}
        className={INPUT}
      />
      <input
        type="password"
        placeholder="Password (min 8 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        maxLength={72}
        className={INPUT}
      />
      <button type="submit" disabled={busy} className={BTN}>
        {busy ? 'Creating…' : 'Create officer'}
      </button>
      {message && (
        <p className={`text-sm ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Officer = { id: string; username: string };

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';
const BTN =
  'rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50';

export function GrantPointsForm({ officers }: { officers: Officer[] }) {
  const router = useRouter();
  const [officerId, setOfficerId] = useState(officers[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/v1/admin/officers/grant-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officer_id: officerId, amount: Number(amount) }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ kind: 'ok', text: `Granted. Officer balance: ${data.balance.toLocaleString()}.` });
      setAmount('');
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
      <h2 className="text-sm font-semibold text-gray-900">Grant points to officer</h2>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Officer
        <select value={officerId} onChange={(e) => setOfficerId(e.target.value)} className={INPUT}>
          {officers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.username}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Amount
        <input
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className={INPUT}
        />
      </label>
      <button type="submit" disabled={busy || !officerId} className={BTN}>
        {busy ? 'Granting…' : 'Grant points'}
      </button>
      {message && (
        <p className={`text-sm ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Officer = { id: string; username: string };

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
    <form onSubmit={submit} className="flex max-w-md flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <h2 className="font-semibold">Grant Points to Officer</h2>
      <select
        value={officerId}
        onChange={(e) => setOfficerId(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        {officers.map((o) => (
          <option key={o.id} value={o.id}>
            {o.username}
          </option>
        ))}
      </select>
      <input
        inputMode="numeric"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={busy || !officerId}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
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

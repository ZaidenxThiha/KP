'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const RULE_TYPES = ['exact', 'contains', 'first_digit', 'last_digit', 'range', 'list', 'all'];

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:bg-gray-100 disabled:text-gray-400';
const BTN =
  'rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50';

// Builds the rule_value jsonb for the chosen rule type from the free-text input.
function buildRuleValue(ruleType: string, raw: string): Record<string, unknown> {
  const v = raw.trim();
  switch (ruleType) {
    case 'exact':
      return { number: v };
    case 'contains':
    case 'first_digit':
    case 'last_digit':
      return { digit: v };
    case 'range': {
      const [from, to] = v.split('-').map((s) => s.trim());
      return { from, to };
    }
    case 'list':
      return { numbers: v.split(',').map((s) => s.trim()).filter(Boolean) };
    default:
      return {};
  }
}

export function NumberLimitForm() {
  const router = useRouter();
  const [gameType, setGameType] = useState('2d');
  const [ruleType, setRuleType] = useState('exact');
  const [value, setValue] = useState('');
  const [maxPoints, setMaxPoints] = useState('1000');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/v1/admin/number-limits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: gameType,
        market: 'all',
        rule_type: ruleType,
        rule_value: buildRuleValue(ruleType, value),
        max_points: Number(maxPoints),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ kind: 'ok', text: 'Rule created.' });
      setValue('');
      router.refresh();
    } else {
      setMessage({ kind: 'err', text: data.error?.message ?? 'Failed.' });
    }
    setBusy(false);
  }

  const hint =
    ruleType === 'range'
      ? 'e.g. 20-29'
      : ruleType === 'list'
        ? 'e.g. 11,22,33'
        : ruleType === 'all'
          ? '(no value needed)'
          : 'a single number or digit';

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-gray-900">Create number-limit rule</h2>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Game
        <select value={gameType} onChange={(e) => setGameType(e.target.value)} className={INPUT}>
          <option value="2d">2D</option>
          <option value="3d">3D</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Rule type
        <select value={ruleType} onChange={(e) => setRuleType(e.target.value)} className={INPUT}>
          {RULE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Value
        <input
          placeholder={hint}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={ruleType === 'all'}
          className={INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Max points
        <input
          inputMode="numeric"
          value={maxPoints}
          onChange={(e) => setMaxPoints(e.target.value)}
          required
          className={INPUT}
        />
      </label>
      <button type="submit" disabled={busy} className={BTN}>
        {busy ? 'Saving…' : 'Create rule'}
      </button>
      {message && (
        <p className={`text-sm ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}

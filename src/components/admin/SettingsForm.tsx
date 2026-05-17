'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Settings = {
  free_mode_enabled: boolean;
  new_player_bonus_enabled: boolean;
  new_player_bonus_amount: number;
  auto_settle_enabled: boolean;
  admin_approval_required: boolean;
  api_result_mode: string;
  default_close_before_minutes: number;
};

const TOGGLES: { key: keyof Settings; label: string }[] = [
  { key: 'free_mode_enabled', label: 'Free mode enabled' },
  { key: 'new_player_bonus_enabled', label: 'New player bonus enabled' },
  { key: 'auto_settle_enabled', label: 'Auto-settle enabled' },
  { key: 'admin_approval_required', label: 'Admin approval required' },
];

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/v1/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ kind: 'ok', text: 'Settings saved.' });
      router.refresh();
    } else {
      setMessage({ kind: 'err', text: data.error?.message ?? 'Failed.' });
    }
    setBusy(false);
  }

  return (
    <div className="flex max-w-md flex-col gap-3 rounded-lg border border-gray-200 p-4">
      {TOGGLES.map((t) => (
        <label key={t.key} className="flex items-center justify-between text-sm">
          {t.label}
          <input
            type="checkbox"
            checked={Boolean(settings[t.key])}
            onChange={(e) => setSettings({ ...settings, [t.key]: e.target.checked })}
          />
        </label>
      ))}
      <label className="flex items-center justify-between text-sm">
        New player bonus amount
        <input
          inputMode="numeric"
          value={settings.new_player_bonus_amount}
          onChange={(e) =>
            setSettings({ ...settings, new_player_bonus_amount: Number(e.target.value) })
          }
          className="w-28 rounded-md border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="flex items-center justify-between text-sm">
        Close-before minutes
        <input
          inputMode="numeric"
          value={settings.default_close_before_minutes}
          onChange={(e) =>
            setSettings({ ...settings, default_close_before_minutes: Number(e.target.value) })
          }
          className="w-28 rounded-md border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="flex items-center justify-between text-sm">
        API result mode
        <select
          value={settings.api_result_mode}
          onChange={(e) => setSettings({ ...settings, api_result_mode: e.target.value })}
          className="rounded-md border border-gray-300 px-2 py-1"
        >
          <option value="manual">manual</option>
          <option value="api">api</option>
        </select>
      </label>
      <button
        onClick={save}
        disabled={busy}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save settings'}
      </button>
      {message && (
        <p className={`text-sm ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

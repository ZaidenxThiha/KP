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

const TOGGLES: { key: keyof Settings; label: string; hint: string }[] = [
  { key: 'free_mode_enabled', label: 'Free mode', hint: 'Players can guess without spending points.' },
  {
    key: 'new_player_bonus_enabled',
    label: 'New-player bonus',
    hint: 'Grant a welcome bonus when a player is created.',
  },
];

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';
const BTN =
  'rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50';
const CHECKBOX = 'mt-0.5 h-4 w-4 shrink-0 accent-[#4f46e5]';

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={CHECKBOX}
      />
    </label>
  );
}

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
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
      {TOGGLES.map((t) => (
        <ToggleRow
          key={t.key}
          label={t.label}
          hint={t.hint}
          checked={Boolean(settings[t.key])}
          onChange={(v) => setSettings({ ...settings, [t.key]: v })}
        />
      ))}
      <ToggleRow
        label="Auto-approve winners"
        hint="On: winners are paid automatically once results post. Off: you approve each round."
        checked={settings.auto_settle_enabled && !settings.admin_approval_required}
        onChange={(v) =>
          setSettings({
            ...settings,
            auto_settle_enabled: v,
            admin_approval_required: !v,
          })
        }
      />

      <div className="border-t border-gray-100" />

      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        New-player bonus amount
        <input
          inputMode="numeric"
          value={settings.new_player_bonus_amount}
          onChange={(e) =>
            setSettings({ ...settings, new_player_bonus_amount: Number(e.target.value) })
          }
          className={INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Close-before minutes
        <input
          inputMode="numeric"
          value={settings.default_close_before_minutes}
          onChange={(e) =>
            setSettings({ ...settings, default_close_before_minutes: Number(e.target.value) })
          }
          className={INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        API result mode
        <select
          value={settings.api_result_mode}
          onChange={(e) => setSettings({ ...settings, api_result_mode: e.target.value })}
          className={INPUT}
        >
          <option value="manual">Manual</option>
          <option value="api">API</option>
        </select>
      </label>

      <button onClick={save} disabled={busy} className={BTN}>
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

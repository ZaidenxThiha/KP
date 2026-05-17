'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usernameToEmail } from '@/lib/username';

const INPUT =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username.trim()),
      password,
    });
    if (signInError || !data.user) {
      setError('Invalid username or password.');
      setBusy(false);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_user_id', data.user.id)
      .single();
    const dest =
      profile?.role === 'admin' ? '/admin' : profile?.role === 'officer' ? '/officer' : '/';
    router.push(dest);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">2D / 3D Guessing Game</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to play.</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5"
        >
          <label className="text-xs font-medium text-gray-500">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoComplete="username"
              required
              className={INPUT}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className={INPUT}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent/90 disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-400">
          Points are virtual game points only. They have no cash value and cannot be exchanged for
          money or prizes.
        </p>
      </div>
    </main>
  );
}

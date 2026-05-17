'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usernameToEmail } from '@/lib/username';

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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-bold">2D / 3D Guessing Game</h1>
        <p className="mt-1 text-sm text-gray-600">Sign in to play.</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoComplete="username"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2.5 font-medium text-accent-fg disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <p className="text-xs text-gray-500">
        Points are virtual game points only. They have no cash value and cannot be exchanged
        for money or prizes.
      </p>
    </main>
  );
}

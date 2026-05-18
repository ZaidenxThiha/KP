'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton({ className, label }: { className?: string; label?: string }) {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }
  return (
    <button onClick={logout} className={className ?? 'text-sm text-gray-600 underline'}>
      {label ?? 'Log out'}
    </button>
  );
}

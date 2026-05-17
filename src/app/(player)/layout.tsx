import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { PlayerTabBar } from '@/components/PlayerTabBar';

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'player') redirect(profile.role === 'admin' ? '/admin' : '/officer');

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <span className="font-semibold text-gray-900">{profile.username}</span>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
          {profile.points_balance.toLocaleString()} pts
        </span>
      </header>
      <main className="flex-1 px-4 py-5 pb-28">{children}</main>
      <PlayerTabBar />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PlayerTabBar } from '@/components/PlayerTabBar';
import { mmTime } from '@/lib/datetime';
import { t } from '@/lib/strings';

export const dynamic = 'force-dynamic';

function WalletIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8a2 2 0 0 1 2-2h12.5" />
      <rect x="3" y="6" width="18" height="13" rx="2.4" />
      <path d="M16.5 11.5h4.5v4h-4.5a2 2 0 0 1 0-4Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3.1 1.9" />
    </svg>
  );
}

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'player') redirect(profile.role === 'admin' ? '/admin' : '/officer');

  // Soonest still-upcoming close time across all open rounds — shown in the
  // header. Not limited to today, so it keeps pointing at the next draw once
  // today's rounds have all closed.
  const { data: rounds } = await createClient()
    .from('rounds')
    .select('close_time')
    .eq('status', 'open')
    .gt('close_time', new Date().toISOString())
    .order('close_time', { ascending: true })
    .limit(1);

  const nextClose = rounds?.[0]?.close_time as string | undefined;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-brand">
            <WalletIcon />
          </span>
          <div className="leading-tight">
            <p className="text-[11px] text-gray-400">{t.balance}</p>
            <p className="text-sm font-bold text-green-600">
              {profile.points_balance.toLocaleString()}
              <span className="ml-0.5 text-xs font-medium">{t.kyat}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right leading-tight">
            <p className="text-[11px] text-gray-400">{t.closeTime}</p>
            <p className="text-sm font-bold text-green-600">{nextClose ? mmTime(nextClose) : '—'}</p>
          </div>
          <span className="text-brand">
            <ClockIcon />
          </span>
        </div>
      </header>
      <main className="flex-1 px-4 py-4 pb-28">{children}</main>
      <PlayerTabBar />
    </div>
  );
}

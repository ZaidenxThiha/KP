import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PlayerTabBar } from '@/components/PlayerTabBar';
import { t } from '@/lib/strings';

export const dynamic = 'force-dynamic';

function WalletIcon() {
  return (
    <svg
      width="26"
      height="26"
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

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'player') redirect(profile.role === 'admin' ? '/admin' : '/officer');

  // Admin-configurable brand shown top-right on every player screen.
  const { data: brand } = await createClient()
    .from('game_settings')
    .select('brand_name, brand_logo_url')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-brand">
            <WalletIcon />
          </span>
          <div className="leading-tight">
            <p className="text-xs text-gray-400">{t.balance}</p>
            <p className="text-base font-bold text-green-600">
              {profile.points_balance.toLocaleString()}
              <span className="ml-0.5 text-sm font-medium">{t.kyat}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {brand?.brand_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.brand_logo_url}
              alt=""
              className="h-8 w-8 rounded-md object-contain"
            />
          ) : null}
          <span className="text-base font-bold text-brand">{brand?.brand_name ?? '2D'}</span>
        </div>
      </header>
      <main className="flex-1 px-4 py-4 pb-32">{children}</main>
      <PlayerTabBar />
    </div>
  );
}

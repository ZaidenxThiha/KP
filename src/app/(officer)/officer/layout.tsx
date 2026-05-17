import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

const NAV = [
  { href: '/officer', label: 'Players' },
  { href: '/officer/create-player', label: 'Create Player' },
  { href: '/officer/give-points', label: 'Give Points' },
  { href: '/officer/distribution', label: 'Distribution' },
];

export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'officer') redirect(profile.role === 'admin' ? '/admin' : '/');

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-gray-200 bg-white p-4 sm:flex">
        <p className="px-2 pb-3 text-sm font-bold">Officer</p>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {n.label}
          </Link>
        ))}
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <span className="text-sm font-medium">{profile.username}</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {profile.points_balance.toLocaleString()} pts
            </span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

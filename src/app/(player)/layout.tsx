import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/guess', label: 'Guess' },
  { href: '/results', label: 'Results' },
  { href: '/history', label: 'History' },
  { href: '/profile', label: 'Profile' },
];

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'player') redirect(profile.role === 'admin' ? '/admin' : '/officer');

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <span className="font-semibold">{profile.username}</span>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
          {profile.points_balance.toLocaleString()} pts
        </span>
      </header>
      <main className="flex-1 px-4 py-4 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around border-t border-gray-200 bg-white py-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-2 py-1 text-xs font-medium text-gray-600"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

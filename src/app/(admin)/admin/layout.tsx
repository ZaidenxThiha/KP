import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/officers', label: 'Officers' },
  { href: '/admin/distribution', label: 'Distribution' },
  { href: '/admin/rounds', label: 'Rounds' },
  { href: '/admin/winning-rates', label: 'Winning Rates' },
  { href: '/admin/number-limits', label: 'Number Limits' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/api-results', label: 'API Results' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'admin') redirect(profile.role === 'officer' ? '/officer' : '/');

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-gray-200 bg-white p-4 sm:flex">
        <p className="px-2 pb-3 text-sm font-bold">Admin</p>
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
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

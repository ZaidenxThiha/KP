import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { DashboardShell } from '@/components/DashboardShell';

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
    <DashboardShell role="admin" username={profile.username} nav={NAV}>
      {children}
    </DashboardShell>
  );
}

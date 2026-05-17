import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { DashboardShell } from '@/components/DashboardShell';

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
    <DashboardShell
      role="officer"
      username={profile.username}
      balance={profile.points_balance}
      nav={NAV}
    >
      {children}
    </DashboardShell>
  );
}

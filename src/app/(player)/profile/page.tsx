import { getCurrentProfile } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  const rows = [
    { label: 'Username', value: profile!.username },
    { label: 'Balance', value: `${profile!.points_balance.toLocaleString()} pts` },
    { label: 'Status', value: profile!.status },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-gray-900">Profile</h1>
      <dl className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between px-4 py-3">
            <dt className="text-sm text-gray-500">{r.label}</dt>
            <dd className="text-sm font-medium text-gray-900">{r.value}</dd>
          </div>
        ))}
      </dl>
      <LogoutButton className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50" />
      <p className="text-center text-xs text-gray-400">
        Points are virtual game points only. They have no cash value and cannot be exchanged for
        money or prizes.
      </p>
    </div>
  );
}

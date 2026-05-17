import { getCurrentProfile } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Profile</h1>
      <dl className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        <div className="flex justify-between p-3">
          <dt className="text-sm text-gray-500">Username</dt>
          <dd className="text-sm font-medium">{profile!.username}</dd>
        </div>
        <div className="flex justify-between p-3">
          <dt className="text-sm text-gray-500">Balance</dt>
          <dd className="text-sm font-medium">
            {profile!.points_balance.toLocaleString()} pts
          </dd>
        </div>
        <div className="flex justify-between p-3">
          <dt className="text-sm text-gray-500">Status</dt>
          <dd className="text-sm font-medium">{profile!.status}</dd>
        </div>
      </dl>
      <LogoutButton className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium" />
      <p className="text-xs text-gray-400">
        Points are virtual game points only. They have no cash value and cannot be exchanged
        for money or prizes.
      </p>
    </div>
  );
}

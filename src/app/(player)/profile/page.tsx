import { getCurrentProfile } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';
import { t } from '@/lib/strings';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  active: 'အသုံးပြုနိုင်သည်',
  disabled: 'ပိတ်ထားသည်',
  suspended: 'ဆိုင်းငံ့ထားသည်',
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  const rows = [
    { label: t.profile.username, value: profile!.username },
    { label: t.profile.balance, value: `${profile!.points_balance.toLocaleString()} ${t.kyat}` },
    { label: t.profile.status, value: STATUS_LABEL[profile!.status] ?? profile!.status },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-bold text-brand">{t.profile.title}</h1>
      <dl className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between px-4 py-3">
            <dt className="text-sm text-gray-500">{r.label}</dt>
            <dd className="text-sm font-medium text-gray-900">{r.value}</dd>
          </div>
        ))}
      </dl>
      <LogoutButton
        label={t.profile.logout}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      />
      <p className="text-center text-xs leading-relaxed text-gray-400">{t.disclaimer}</p>
    </div>
  );
}

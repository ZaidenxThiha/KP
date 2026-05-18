import { t } from '@/lib/strings';

export const dynamic = 'force-dynamic';

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-brand">{t.help.title}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-base leading-relaxed text-gray-700">{t.help.body}</p>
      </div>
      <p className="text-center text-xs leading-relaxed text-gray-400">{t.disclaimer}</p>
    </div>
  );
}

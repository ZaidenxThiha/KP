import Link from 'next/link';
import { LiveResults } from '@/components/player/LiveResults';
import { t } from '@/lib/strings';

export default function PlayerHome() {
  return (
    <div className="flex flex-col gap-4">
      <LiveResults />
      <Link
        href="/guess"
        className="rounded-xl bg-brand py-3.5 text-center text-lg font-bold text-brand-fg transition active:scale-[0.99]"
      >
        {t.home.bet}
      </Link>
      <p className="text-center text-xs leading-relaxed text-gray-400">{t.disclaimer}</p>
    </div>
  );
}

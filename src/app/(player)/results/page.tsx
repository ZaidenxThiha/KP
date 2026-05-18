import { LiveResults } from '@/components/player/LiveResults';
import { t } from '@/lib/strings';

export default function ResultsPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-base font-bold text-brand">{t.home.liveTitle}</h1>
      <LiveResults />
    </div>
  );
}

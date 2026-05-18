import { createClient } from '@/lib/supabase/server';
import { t } from '@/lib/strings';

export const dynamic = 'force-dynamic';

export default async function HelpPage() {
  // Title and body are admin-editable on the Settings page.
  const { data: settings } = await createClient()
    .from('game_settings')
    .select('help_title, help_body')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  const title = settings?.help_title || t.help.title;
  const body = settings?.help_body || t.help.body;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-brand">{title}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="whitespace-pre-line text-base leading-relaxed text-gray-700">{body}</p>
      </div>
      <p className="text-center text-xs leading-relaxed text-gray-400">{t.disclaimer}</p>
    </div>
  );
}

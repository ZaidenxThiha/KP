import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const { data: settings } = await createClient()
    .from('game_settings')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  if (!settings) {
    return <p className="text-sm text-red-600">Game settings row is missing.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Settings</h1>
      <SettingsForm
        initial={{
          free_mode_enabled: settings.free_mode_enabled,
          new_player_bonus_enabled: settings.new_player_bonus_enabled,
          new_player_bonus_amount: settings.new_player_bonus_amount,
          auto_settle_enabled: settings.auto_settle_enabled,
          admin_approval_required: settings.admin_approval_required,
          api_result_mode: settings.api_result_mode,
          default_close_before_minutes: settings.default_close_before_minutes,
        }}
      />
    </div>
  );
}

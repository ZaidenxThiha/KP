-- Admin-editable branding and help content. Four new columns on the
-- game_settings singleton: the brand name and logo shown in the player header,
-- and the title and body of the player Help screen.
alter table public.game_settings
  add column if not exists brand_name text not null default '2D',
  add column if not exists brand_logo_url text,
  add column if not exists help_title text not null default 'အကူအညီ',
  add column if not exists help_body text not null default
    'ဂဏန်းရွေးချယ်၍ ထိုးငွေ သတ်မှတ်ပြီး "ထိုးမည်" ကို နှိပ်ပါ။ ဂဏန်းတစ်ခုစီအောက်ရှိ အရောင်တန်းသည် ထိုဂဏန်း၏ နေရာလွတ် အခြေအနေကို ပြသသည် — အစိမ်းသည် နေရာလွတ်ရှိ၊ အဝါသည် ပြည့်လုနီးပါး၊ အနီသည် ပြည့်ပြီ ဟု အဓိပ္ပာယ်ရသည်။';

-- Extend the settings update RPC so the four new keys are accepted in the
-- partial patch. Every other column is unchanged from 20260517001900.
create or replace function public.update_game_settings(p_patch jsonb)
returns public.game_settings language plpgsql security definer
set search_path = public as $$
declare
  v_old public.game_settings;
  v_row public.game_settings;
begin
  perform public.require_role('admin');
  select * into v_old from public.game_settings
   where id = '00000000-0000-0000-0000-000000000001';

  update public.game_settings g set
    free_mode_enabled = coalesce((p_patch->>'free_mode_enabled')::boolean, g.free_mode_enabled),
    new_player_bonus_enabled = coalesce((p_patch->>'new_player_bonus_enabled')::boolean,
      g.new_player_bonus_enabled),
    new_player_bonus_amount = coalesce((p_patch->>'new_player_bonus_amount')::bigint,
      g.new_player_bonus_amount),
    daily_claim_enabled = coalesce((p_patch->>'daily_claim_enabled')::boolean,
      g.daily_claim_enabled),
    daily_claim_amount = coalesce((p_patch->>'daily_claim_amount')::bigint, g.daily_claim_amount),
    auto_settle_enabled = coalesce((p_patch->>'auto_settle_enabled')::boolean,
      g.auto_settle_enabled),
    admin_approval_required = coalesce((p_patch->>'admin_approval_required')::boolean,
      g.admin_approval_required),
    api_result_mode = coalesce(p_patch->>'api_result_mode', g.api_result_mode),
    default_close_before_minutes = coalesce(
      (p_patch->>'default_close_before_minutes')::int, g.default_close_before_minutes),
    rapidapi_calendar_path = coalesce(p_patch->>'rapidapi_calendar_path',
      g.rapidapi_calendar_path),
    rapidapi_calendar_fallback_path = coalesce(p_patch->>'rapidapi_calendar_fallback_path',
      g.rapidapi_calendar_fallback_path),
    rapidapi_results_path = coalesce(p_patch->>'rapidapi_results_path', g.rapidapi_results_path),
    brand_name = coalesce(p_patch->>'brand_name', g.brand_name),
    brand_logo_url = coalesce(p_patch->>'brand_logo_url', g.brand_logo_url),
    help_title = coalesce(p_patch->>'help_title', g.help_title),
    help_body = coalesce(p_patch->>'help_body', g.help_body)
  where g.id = '00000000-0000-0000-0000-000000000001'
  returning * into v_row;

  perform public.write_audit('settings.update', 'game_settings', v_row.id,
    to_jsonb(v_old), to_jsonb(v_row));
  return v_row;
end;
$$;

grant execute on function public.update_game_settings(jsonb) to authenticated;

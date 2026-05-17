import { randomInt } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { usernameToEmail } from '@/lib/username';
import { apiError, apiOk, parseBody, requireApiRole } from '@/lib/api';
import { createPlayerBodySchema } from '@/lib/validation';

// Unambiguous charset — no 0/O/1/I/l.
const PW_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function genUsername(): string {
  return 'P' + String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function genPassword(): string {
  const len = randomInt(6, 9); // 6–8 chars
  let out = '';
  for (let i = 0; i < len; i++) out += PW_CHARS[randomInt(0, PW_CHARS.length)];
  return out;
}

// POST /api/v1/officer/players/create — officer creates a player. The plaintext
// password is returned exactly once.
export async function POST(request: Request) {
  const auth = await requireApiRole('officer');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, createPlayerBodySchema);
  if ('error' in body) return body.error;

  const service = createServiceClient();
  const password = genPassword();

  // Retry on the rare username collision (unique index on lower(username)).
  let userId: string | null = null;
  let username = '';
  for (let attempt = 0; attempt < 5 && !userId; attempt++) {
    username = genUsername();
    const { data, error } = await service.auth.admin.createUser({
      email: usernameToEmail(username),
      password,
      email_confirm: true,
      user_metadata: {
        username,
        role: 'player',
        assigned_officer_id: auth.profile.id,
        created_by: auth.profile.id,
      },
    });
    if (!error && data.user) {
      userId = data.user.id;
    } else if (error && !/duplicate|already/i.test(error.message)) {
      return apiError('internal_error', error.message);
    }
  }
  if (!userId) return apiError('conflict', 'Could not allocate a username');

  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('id, username, points_balance')
    .eq('auth_user_id', userId)
    .single();
  if (profileError || !profile) {
    return apiError('internal_error', 'Profile was not created');
  }

  const { data: bonus } = await service.rpc('apply_new_player_bonus', {
    p_player_id: profile.id,
    p_with_bonus: body.data.welcome_bonus ?? true,
  });
  const balance =
    bonus && typeof bonus === 'object' && 'balance' in bonus
      ? (bonus as { balance: number }).balance
      : profile.points_balance;

  return apiOk({ player_id: profile.id, username, password, balance }, 201);
}

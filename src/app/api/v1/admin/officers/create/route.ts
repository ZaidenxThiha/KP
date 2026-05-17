import { createServiceClient } from '@/lib/supabase/service';
import { usernameToEmail } from '@/lib/username';
import { apiError, apiOk, parseBody, requireApiRole } from '@/lib/api';
import { createOfficerBodySchema } from '@/lib/validation';

// POST /api/v1/admin/officers/create — admin chooses the officer's credentials.
export async function POST(request: Request) {
  const auth = await requireApiRole('admin');
  if ('error' in auth) return auth.error;

  const body = await parseBody(request, createOfficerBodySchema);
  if ('error' in body) return body.error;

  const service = createServiceClient();
  const { data, error } = await service.auth.admin.createUser({
    email: usernameToEmail(body.data.username),
    password: body.data.password,
    email_confirm: true,
    user_metadata: {
      username: body.data.username,
      role: 'officer',
      created_by: auth.profile.id,
    },
  });
  if (error || !data.user) {
    return apiError('conflict', error?.message ?? 'Could not create officer');
  }

  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('auth_user_id', data.user.id)
    .single();
  if (!profile) return apiError('internal_error', 'Profile was not created');

  // Give every officer an officer_limits row (null caps = unlimited).
  await service.rpc('ensure_officer_limits', { p_officer_id: profile.id });

  return apiOk({ officer_id: profile.id, username: body.data.username }, 201);
}

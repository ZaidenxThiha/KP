import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PLAYER_PATHS = ['/', '/guess', '/results', '/history', '/profile', '/help'];

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  const isOfficer = path === '/officer' || path.startsWith('/officer/');
  const isPlayer = PLAYER_PATHS.includes(path);
  if (!isAdmin && !isOfficer && !isPlayer) return response;

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAdmin || isOfficer) {
    const { data } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('auth_user_id', user.id)
      .single();
    const profile = data as { role: string; status: string } | null;
    const ok =
      profile?.status === 'active' &&
      ((isAdmin && profile.role === 'admin') || (isOfficer && profile.role === 'officer'));
    if (!ok) return NextResponse.redirect(new URL('/403', request.url));
  }

  return response;
}

export const config = {
  // Run on every page except Next internals, the API (routes self-authorize)
  // and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};

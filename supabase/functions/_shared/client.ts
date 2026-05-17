// Shared helpers for the Edge Functions (Deno runtime).
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Scheduled functions are called by Supabase Cron or the internal API routes.
// Require the shared SYNC_SECRET when it is configured.
export function checkSyncSecret(req: Request): boolean {
  const expected = Deno.env.get('SYNC_SECRET');
  if (!expected) return true;
  return req.headers.get('x-sync-secret') === expected;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const RAPIDAPI_HOST = 'thai-lotto-new-api.p.rapidapi.com';

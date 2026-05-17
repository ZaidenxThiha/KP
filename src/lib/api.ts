import { NextResponse } from 'next/server';
import type { z, ZodTypeAny } from 'zod';
import { getCurrentProfile, type Profile, type Role } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

// Maps every API error code (docs/API.md) to an HTTP status.
export const ERROR_STATUS: Record<string, number> = {
  invalid_input: 400,
  unauthenticated: 401,
  forbidden: 403,
  round_closed: 403,
  round_not_open: 403,
  insufficient_balance: 403,
  number_full: 403,
  partial_room: 403,
  daily_limit_exceeded: 403,
  per_player_cap_exceeded: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal_error: 500,
};

type ErrorDetails = Record<string, unknown> | undefined;

export function apiError(code: string, message?: string, details?: ErrorDetails): NextResponse {
  const status = ERROR_STATUS[code] ?? 500;
  return NextResponse.json(
    { error: { code, message: message ?? code, details } },
    { status },
  );
}

export function apiOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

// Translates a Postgres/PostgREST error from an RPC into the shared envelope.
// Our RPCs raise app_error(code, detail) — code arrives as `message`, the
// jsonb detail as `details`.
export function mapRpcError(error: { message: string; details?: string | null }): NextResponse {
  const code = error.message?.trim();
  if (code && code in ERROR_STATUS) {
    let details: ErrorDetails;
    try {
      details = error.details ? JSON.parse(error.details) : undefined;
    } catch {
      details = undefined;
    }
    return apiError(code, code, details);
  }
  return apiError('internal_error', 'Unexpected database error');
}

// Parse + validate a JSON body. Returns the value or an error response.
// Generic over the schema itself so zod's output type (with defaults applied)
// is preserved.
export async function parseBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<{ data: z.infer<S> } | { error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: apiError('invalid_input', 'Body must be valid JSON') };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: apiError('invalid_input', 'Validation failed', {
        issues: parsed.error.flatten(),
      }),
    };
  }
  return { data: parsed.data };
}

// Guard for /api/v1/internal/* — server-to-server callers must present the
// shared SYNC_SECRET. Returns an error response when the header is wrong.
export function requireSyncSecret(request: Request): NextResponse | null {
  const expected = process.env.SYNC_SECRET;
  const provided = request.headers.get('x-sync-secret');
  if (!expected || provided !== expected) {
    return apiError('forbidden', 'Invalid sync secret');
  }
  return null;
}

// Enforce a per-key rate limit. Returns a 429 response when exceeded, else null.
export function enforceRateLimit(key: string, limitPerMinute: number): NextResponse | null {
  const result = rateLimit(key, limitPerMinute);
  if (result.ok) return null;
  const response = apiError('rate_limited', 'Too many requests');
  response.headers.set('Retry-After', String(result.retryAfter));
  return response;
}

// Require an authenticated caller with a given role inside a route handler.
export async function requireApiRole(
  role: Role,
): Promise<{ profile: Profile } | { error: NextResponse }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: apiError('unauthenticated') };
  if (profile.status !== 'active') return { error: apiError('forbidden', 'Account disabled') };
  if (profile.role !== role) return { error: apiError('forbidden', `Requires ${role} role`) };
  return { profile };
}

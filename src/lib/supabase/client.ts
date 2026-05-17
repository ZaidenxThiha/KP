import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Browser client. Uses the anon key only — every query runs through RLS.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

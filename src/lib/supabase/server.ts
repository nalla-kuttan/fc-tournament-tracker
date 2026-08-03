import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminEnv, getSupabaseReadEnv } from '@/lib/env';

// Admin client for mutations - uses service_role key to bypass RLS
// Admin PIN validation is handled at the API route level
export function createAdminClient() {
  const env = getSupabaseAdminEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Read-only server client using anon key
export function createServerClient() {
  const env = getSupabaseReadEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Supabase Admin Client with service role key.
 *
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS) policies!
 *
 * Use this client ONLY for:
 * - Creating users (signup)
 * - Administrative operations that need to bypass RLS
 * - Cron jobs and background tasks
 * - Server-side operations that are already authorized
 *
 * NEVER expose this client to client-side code!
 * NEVER use this for regular queries - use server.ts instead!
 *
 * Usage (server-side only):
 *   import { createAdminClient } from '@/lib/supabase/admin'
 *   const supabase = createAdminClient()
 *
 * @returns Supabase client with service role access
 */
export function createAdminClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Helper to verify cron secret for scheduled jobs.
 *
 * Usage in API routes:
 *   import { verifyCronSecret } from '@/lib/supabase/admin'
 *   if (!verifyCronSecret(request)) {
 *     return Response.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *
 * @param request - Request object with authorization header
 * @returns true if cron secret is valid
 */
export function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured - cron jobs will not work');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

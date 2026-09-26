import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

/**
 * Supabase client for use in Client Components and browser-side code.
 *
 * This client:
 * - Uses the anon key (safe to expose to clients)
 * - Respects Row Level Security (RLS) policies
 * - Automatically handles session management via cookies
 *
 * Usage in Client Components:
 *   'use client'
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 *
 * @returns Supabase client instance
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

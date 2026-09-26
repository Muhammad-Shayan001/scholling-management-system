import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 *
 * This client:
 * - Uses the anon key (respects RLS)
 * - Reads/writes auth cookies automatically
 * - Works in React Server Components
 *
 * Usage in Server Components:
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = await createClient()
 *
 * Usage in Server Actions:
 *   'use server'
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = await createClient()
 *
 * @returns Promise<Supabase client instance>
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

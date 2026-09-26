import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

/**
 * Supabase client for use in Next.js Middleware (Edge Runtime).
 *
 * This client:
 * - Runs on Vercel Edge Network (faster than serverless)
 * - Updates auth cookies on every request
 * - Refreshes expired sessions automatically
 *
 * Usage in middleware.ts:
 *   import { updateSession } from '@/lib/supabase/middleware'
 *   export async function middleware(request: NextRequest) {
 *     return await updateSession(request)
 *   }
 *
 * @param request - Next.js request object
 * @returns Next.js response with updated cookies
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/forgot-password') &&
    !request.nextUrl.pathname.startsWith('/reset-password') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages, redirect to appropriate dashboard
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup'))
  ) {
    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();

    // Redirect based on role
    switch (profile?.role) {
      case 'super_admin':
        url.pathname = '/super-admin';
        break;
      case 'admin':
        url.pathname = '/admin';
        break;
      case 'teacher':
        url.pathname = '/teacher';
        break;
      case 'student':
        url.pathname = '/student';
        break;
      case 'parent':
        url.pathname = '/guardian';
        break;
      default:
        url.pathname = '/pending';
    }

    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so: `NextResponse.next({ request })`
  // 2. Copy over the cookies, like so: `supabaseResponse.cookies.getAll().forEach(...)`
  // 3. Change the `headers` of the response, like so: `supabaseResponse.headers.set(x-custom-header, ...)`

  return supabaseResponse;
}

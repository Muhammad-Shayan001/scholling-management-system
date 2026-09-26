import { updateSession } from '@/lib/supabase/middleware';
import { NextRequest } from 'next/server';

/**
 * Middleware to protect routes and refresh authentication sessions.
 *
 * This middleware:
 * - Refreshes Supabase auth sessions on every request
 * - Redirects unauthenticated users to login
 * - Redirects authenticated users away from auth pages to their dashboard
 * - Runs on Vercel Edge Network for better performance
 *
 * Protected routes: Everything except /login, /signup, /forgot-password, and public assets
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - API routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

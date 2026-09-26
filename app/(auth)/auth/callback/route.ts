import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user profile to determine role
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Redirect based on role
        let redirectPath = next;
        switch (profile?.role) {
          case 'super_admin':
            redirectPath = '/super-admin';
            break;
          case 'admin':
            redirectPath = '/admin';
            break;
          case 'teacher':
            redirectPath = '/teacher';
            break;
          case 'student':
            redirectPath = '/student';
            break;
          case 'parent':
            redirectPath = '/guardian';
            break;
          default:
            redirectPath = '/pending';
        }

        return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    new URL('/login?error=Could not authenticate', requestUrl.origin)
  );
}

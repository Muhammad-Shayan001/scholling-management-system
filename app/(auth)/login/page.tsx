import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Login | SKOLIC ENTERPRISE',
  description: 'Sign in to your account',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirectedFrom?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect to appropriate dashboard
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    switch (profile?.role) {
      case 'super_admin':
        redirect('/super-admin');
      case 'admin':
        redirect('/admin');
      case 'teacher':
        redirect('/teacher');
      case 'student':
        redirect('/student');
      case 'parent':
        redirect('/guardian');
      default:
        redirect('/pending');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            SKOLIC ENTERPRISE
          </p>
        </div>
        <LoginForm redirectTo={searchParams.redirectedFrom} />
      </div>
    </div>
  );
}

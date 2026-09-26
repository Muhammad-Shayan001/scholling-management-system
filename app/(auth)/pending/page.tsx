import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Account Pending | SKOLIC ENTERPRISE',
  description: 'Your account is pending approval',
};

export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Account Pending
          </h2>
          <p className="mt-4 text-sm text-gray-600">
            Your account has been created but is not yet assigned to an
            organization. Please contact your school administrator to complete
            your profile setup.
          </p>
          <div className="mt-6">
            <p className="text-sm text-gray-500">Logged in as: {user.email}</p>
          </div>
          <div className="mt-6">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

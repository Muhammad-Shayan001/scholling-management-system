import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { CreateCampusForm } from './create-campus-form';

export const metadata: Metadata = {
  title: 'Add Campus | SKOLIC ENTERPRISE',
  description: 'Create a new campus',
};

export default async function CreateCampusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' || !profile.organization_id) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/admin" className="text-xl font-bold text-gray-900">
                SKOLIC ENTERPRISE
              </a>
              <nav className="flex gap-4">
                <a
                  href="/admin"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </a>
                <a
                  href="/admin/campuses"
                  className="text-sm font-medium text-blue-600"
                >
                  Campuses
                </a>
              </nav>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Add Campus</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new campus location for your organization
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <CreateCampusForm />
        </div>
      </div>
    </div>
  );
}

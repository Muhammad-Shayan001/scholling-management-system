import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | SKOLIC ENTERPRISE',
  description: 'Organization administration dashboard',
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email, organization_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' || !profile.organization_id) {
    redirect('/login');
  }

  // Get organization details
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single();

  // Get statistics
  const [
    { count: totalCampuses },
    { count: totalStudents },
    { count: activeStudents },
    { count: totalTeachers },
  ] = await Promise.all([
    supabase
      .from('campuses')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id),
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id),
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active'),
    supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  {organization?.name || 'SKOLIC ENTERPRISE'}
                </h1>
              </div>
              <nav className="ml-8 flex space-x-4">
                <a
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
                >
                  Dashboard
                </a>
                <a
                  href="/admin/campuses"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Campuses
                </a>
                <a
                  href="/admin/members"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Members
                </a>
                <a
                  href="/admin/settings"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Settings
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{profile?.full_name}</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
                Admin
              </span>
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
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Organization Overview
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your organization, campuses, and members
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-blue-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Total Campuses
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {totalCampuses ?? 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-green-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Active Students
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {activeStudents ?? 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-purple-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Total Teachers
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {totalTeachers ?? 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-yellow-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Total Students
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {totalStudents ?? 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a
              href="/admin/campuses/new"
              className="rounded-lg border border-gray-300 bg-white p-4 hover:border-blue-500 hover:shadow-md"
            >
              <h4 className="font-medium text-gray-900">Add Campus</h4>
              <p className="mt-1 text-sm text-gray-600">
                Create a new campus location
              </p>
            </a>
            <a
              href="/admin/members/invite"
              className="rounded-lg border border-gray-300 bg-white p-4 hover:border-blue-500 hover:shadow-md"
            >
              <h4 className="font-medium text-gray-900">Invite Member</h4>
              <p className="mt-1 text-sm text-gray-600">
                Invite staff or teachers to join
              </p>
            </a>
            <a
              href="/admin/settings"
              className="rounded-lg border border-gray-300 bg-white p-4 hover:border-blue-500 hover:shadow-md"
            >
              <h4 className="font-medium text-gray-900">
                Organization Settings
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                Update organization details
              </p>
            </a>
          </div>
        </div>

        {/* Status Banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Organization Status: {organization?.status}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your organization is active. You can now add campuses, invite
                  members, and start managing your school.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

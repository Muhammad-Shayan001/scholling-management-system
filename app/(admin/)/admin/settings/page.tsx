import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GeneralSettingsForm } from './general-settings-form';
import { BrandingSettingsForm } from './branding-settings-form';

export const metadata: Metadata = {
  title: 'Organization Settings | SKOLIC ENTERPRISE',
  description: 'Manage your school organization settings and branding',
};

export default async function SettingsPage() {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get organization membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/login');
  const orgId = membership.organization_id;

  // Fetch organization details
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error || !organization) {
    return <div className="p-12 text-center">Organization details not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Organization Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Configure your institution's identity and global preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Navigation (Simulated for now) */}
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-100 dark:border-indigo-900/30 transition-all">
            General Settings
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            Branding & Visuals
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            Subscription Plan
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            Member Roles
          </button>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6 text-zinc-900 dark:text-white">General Information</h2>
            <GeneralSettingsForm
              initialData={{
                name: organization.name,
                email: organization.email || '',
                phone: organization.phone || '',
                address: organization.address || '',
                website: organization.website || '',
                timezone: organization.timezone,
                currency: organization.currency,
              }}
            />
          </section>

          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6 text-zinc-900 dark:text-white">Institution Branding</h2>
            <BrandingSettingsForm currentLogoUrl={organization.logo_url} />
          </section>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TeachersPage } from './teachers-page';

export const metadata: Metadata = {
  title: 'Teachers | SKOLIC ENTERPRISE',
  description: 'Manage academic staff and department assignments',
};

export default async function TeachersPageWrapper() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/login');

  return <TeachersPage />;
}

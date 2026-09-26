import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentsPage } from './students-page';

export const metadata: Metadata = {
  title: 'Students | SKOLIC ENTERPRISE',
  description: 'Manage student enrollments and records',
};

export default async function StudentsPageWrapper() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/login');

  return <StudentsPage />;
}

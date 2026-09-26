import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AcademicPage } from './academic-page';

export const metadata: Metadata = {
  title: 'Academic Structure | SKOLIC ENTERPRISE',
  description: 'Manage classes, sections, and subject assignments',
};

export default async function AcademicPageWrapper() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/login');

  return <AcademicPage />;
}

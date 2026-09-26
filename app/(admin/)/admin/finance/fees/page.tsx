import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FeesPage } from './fees-page';

export const metadata: Metadata = {
  title: 'Fee Structures | SKOLIC ENTERPRISE',
  description: 'Define fee categories and amounts for each grade',
};

export default async function FeesPageWrapper() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/login');

  return <FeesPage />;
}

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FinancialReportsPage } from './reports-page';

export const metadata: Metadata = {
  title: 'Financial Reports | SKOLIC ENTERPRISE',
  description: 'Organization-wide revenue and collection analytics',
};

export default async function FinancialReportsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/login');

  return <FinancialReportsPage />;
}

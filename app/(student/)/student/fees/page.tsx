import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentFeesDashboard } from './fees-dashboard';

export const metadata: Metadata = {
  title: 'My Fees | SKOLIC ENTERPRISE',
  description: 'View your invoices and payment history',
};

export default async function StudentFeesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify student role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'student') {
    // We allow parents to view this too, but let's stick to students for now
    // In Phase 7, we'll add Guardian portal logic
    redirect('/dashboard');
  }

  return <StudentFeesDashboard />;
}

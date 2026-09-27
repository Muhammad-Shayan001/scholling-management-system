import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TeacherLMSDashboard } from './lms-dashboard';

export const metadata: Metadata = {
  title: 'LMS | SKOLIC ENTERPRISE',
  description: 'Course and content management for teachers',
};

export default async function TeacherLMSPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'teacher') {
    redirect('/dashboard');
  }

  return <TeacherLMSDashboard />;
}

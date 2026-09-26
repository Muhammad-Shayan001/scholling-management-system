import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MembersPage } from './members-page';

export const metadata: Metadata = {
  title: 'Manage Members | SKOLIC ENTERPRISE',
  description: 'Invite and manage organization members',
};

export default async function MembersPageWrapper() {
  const supabase = await createClient();

  // Authorization check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check if user is admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/login');

  return <MembersPage />;
}

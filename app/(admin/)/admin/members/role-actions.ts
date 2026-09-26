'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function assignRole(userId: string, roleId: string) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify if current user has permission to assign roles
  // In a real app, check the RBAC permissions table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return { error: 'Insufficient permissions' };
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'No organization found' };

  try {
    // 1. Assign the role in member_roles
    const { error: roleError } = await adminSupabase
      .from('member_roles')
      .upsert({
        user_id: userId,
        role_id: roleId,
        organization_id: membership.organization_id,
      });

    if (roleError) throw roleError;

    // 2. Also update the primary role in profiles for simple checks
    // Note: We fetch the role name from roles table first
    const { data: roleData } = await adminSupabase
      .from('roles')
      .select('role_name')
      .eq('id', roleId)
      .single();

    if (roleData) {
      await adminSupabase
        .from('profiles')
        .update({ role: roleData.role_name as any })
        .eq('id', userId);
    }

    revalidatePath('/admin/members');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to assign role' };
  }
}

export async function revokeRole(userId: string, roleId: string) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await adminSupabase
    .from('member_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);

  if (error) return { error: error.message };

  revalidatePath('/admin/members');
  return { success: true };
}

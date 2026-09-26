'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

interface CreateCampusInput {
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}

export async function createCampus(input: CreateCampusInput) {
  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' || !profile.organization_id) {
    return { error: 'Unauthorized' };
  }

  const adminClient = createAdminClient();

  try {
    // Create campus
    const { data: campus, error: campusError } = await adminClient
      .from('campuses')
      .insert({
        organization_id: profile.organization_id,
        name: input.name,
        address: input.address || null,
        contact_email: input.contactEmail || null,
        contact_phone: input.contactPhone || null,
      })
      .select()
      .single();

    if (campusError) {
      console.error('Campus creation error:', campusError);
      return { error: 'Failed to create campus' };
    }

    // Log audit event
    await adminClient.rpc('log_audit_event', {
      p_organization_id: profile.organization_id,
      p_action: 'campus_created',
      p_resource_type: 'campus',
      p_resource_id: campus.id,
      p_resource_name: campus.name,
    });

    revalidatePath('/admin/campuses');

    return { success: true, campusId: campus.id };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateCampus(campusId: string, input: CreateCampusInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' || !profile.organization_id) {
    return { error: 'Unauthorized' };
  }

  const adminClient = createAdminClient();

  try {
    const { error } = await adminClient
      .from('campuses')
      .update({
        name: input.name,
        address: input.address || null,
        contact_email: input.contactEmail || null,
        contact_phone: input.contactPhone || null,
      })
      .eq('id', campusId)
      .eq('organization_id', profile.organization_id);

    if (error) {
      return { error: 'Failed to update campus' };
    }

    // Log audit event
    await adminClient.rpc('log_audit_event', {
      p_organization_id: profile.organization_id,
      p_action: 'campus_updated',
      p_resource_type: 'campus',
      p_resource_id: campusId,
      p_resource_name: input.name,
    });

    revalidatePath('/admin/campuses');
    revalidatePath(`/admin/campuses/${campusId}`);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function deleteCampus(campusId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' || !profile.organization_id) {
    return { error: 'Unauthorized' };
  }

  const adminClient = createAdminClient();

  try {
    // Get campus name for audit log
    const { data: campus } = await adminClient
      .from('campuses')
      .select('name')
      .eq('id', campusId)
      .single();

    const { error } = await adminClient
      .from('campuses')
      .delete()
      .eq('id', campusId)
      .eq('organization_id', profile.organization_id);

    if (error) {
      return { error: 'Failed to delete campus' };
    }

    // Log audit event
    await adminClient.rpc('log_audit_event', {
      p_organization_id: profile.organization_id,
      p_action: 'campus_deleted',
      p_resource_type: 'campus',
      p_resource_id: campusId,
      p_resource_name: campus?.name,
    });

    revalidatePath('/admin/campuses');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

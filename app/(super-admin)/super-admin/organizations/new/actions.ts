'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

interface CreateOrganizationInput {
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  adminEmail: string;
  adminName: string;
}

export async function createOrganization(input: CreateOrganizationInput) {
  const supabase = await createClient();

  // Verify super admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return { error: 'Unauthorized' };
  }

  const adminClient = createAdminClient();

  try {
    // Create organization
    const { data: organization, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: input.name,
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone || null,
        address: input.address || null,
        status: 'active',
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      return { error: 'Failed to create organization' };
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(invitationToken)
      .digest('hex');

    // Create admin invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { error: inviteError } = await adminClient
      .from('admin_invitations')
      .insert({
        organization_id: organization.id,
        email: input.adminEmail,
        full_name: input.adminName,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
      });

    if (inviteError) {
      console.error('Invitation creation error:', inviteError);
      return { error: 'Organization created but failed to send invitation' };
    }

    // TODO: Send invitation email with token
    // For now, log the invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}`;
    console.log('Admin invitation URL:', invitationUrl);

    revalidatePath('/super-admin/organizations');

    return { success: true, organizationId: organization.id };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateOrganizationStatus(
  organizationId: string,
  status: 'active' | 'suspended'
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return { error: 'Unauthorized' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('organizations')
    .update({ status })
    .eq('id', organizationId);

  if (error) {
    return { error: 'Failed to update organization status' };
  }

  revalidatePath('/super-admin/organizations');
  revalidatePath(`/super-admin/organizations/${organizationId}`);

  return { success: true };
}

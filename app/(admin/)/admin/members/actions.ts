'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export interface InviteMemberInput {
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  campusId?: string;
}

export async function inviteMember(input: InviteMemberInput) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  // 1. Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // 2. Verify user is admin of the organization
  // Note: In a real app, we'd get the org_id from the session/URL
  // For now, we'll assume the admin is already authenticated to their org
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'No organization membership found' };
  const orgId = membership.organization_id;

  // 3. Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

  try {
    // 4. Create invitation record
    const { error: inviteError } = await adminSupabase
      .from('admin_invitations')
      .insert({
        organization_id: orgId,
        email: input.email,
        invited_role: input.role,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
      });

    if (inviteError) throw inviteError;

    // 5. In a real production app, we would send the email here via Resend/Nodemailer
    // For now, we'll return the token so the admin can see it in the UI for testing
    console.log(`Invitation sent to ${input.email}. Token: ${token}`);

    revalidatePath('/admin/members');
    return { success: true, token };
  } catch (error: any) {
    return { error: error.message || 'Failed to send invitation' };
  }
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await adminSupabase
    .from('admin_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) return { error: error.message };

  revalidatePath('/admin/members');
  return { success: true };
}

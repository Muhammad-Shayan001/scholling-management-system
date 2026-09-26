'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface OrganizationSettingsInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  timezone: string;
  currency: string;
}

export async function updateOrganizationSettings(input: OrganizationSettingsInput) {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // 2. Get current org
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'Organization membership not found' };
  const orgId = membership.organization_id;

  // 3. Verify Admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return { error: 'Insufficient permissions' };
  }

  // 4. Update organization
  const { error } = await supabase
    .from('organizations')
    .update({
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      website: input.website,
      timezone: input.timezone,
      currency: input.currency,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) return { error: error.message };

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function uploadOrganizationLogo(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('logo') as File;

  if (!file) return { error: 'No file provided' };

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'Organization not found' };
  const orgId = membership.organization_id;

  // File validation
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_SIZE) return { error: 'File size exceeds 2MB limit' };

  const fileExt = file.name.split('.').pop();
  const fileName = `logos/${orgId}_${Date.now()}.${fileExt}`;

  try {
    // 1. Upload to Supabase Storage ('organization-assets' bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('organization-assets')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 2. Update organization logo_url
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: uploadData.path })
      .eq('id', orgId);

    if (updateError) throw updateError;

    revalidatePath('/admin/settings');
    return { success: true, path: uploadData.path };
  } catch (error: any) {
    return { error: error.message || 'Upload failed' };
  }
}

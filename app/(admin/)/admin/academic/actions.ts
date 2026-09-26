'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface ClassInput {
  name: string;
  section: string;
  campus_id: string;
  class_teacher_id?: string;
  academic_year: string;
}

export async function createClass(input: ClassInput) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'Organization not found' };
  const orgId = membership.organization_id;

  try {
    const { data: newClass, error } = await adminSupabase
      .from('classes')
      .insert({
        organization_id: orgId,
        campus_id: input.campus_id,
        name: input.name,
        section: input.section,
        class_teacher_id: input.class_teacher_id,
        academic_year: input.academic_year,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/academic');
    return { success: true, classId: newClass.id };
  } catch (error: any) {
    return { error: error.message || 'Failed to create class' };
  }
}

export async function createSubject(input: { name: string; code: string; campus_id: string }) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'Organization not found' };
  const orgId = membership.organization_id;

  try {
    const { data, error } = await adminSupabase
      .from('subjects')
      .insert({
        organization_id: orgId,
        campus_id: input.campus_id,
        name: input.name,
        code: input.code,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/academic');
    return { success: true, subjectId: data.id };
  } catch (error: any) {
    return { error: error.message || 'Failed to create subject' };
  }
}

export async function assignTeacherToSubject(input: { class_id: string; subject_id: string; teacher_id: string }) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const { error } = await adminSupabase
      .from('class_subjects')
      .upsert({
        class_id: input.class_id,
        subject_id: input.subject_id,
        teacher_id: input.teacher_id,
      });

    if (error) throw error;

    revalidatePath('/admin/academic');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to assign teacher' };
  }
}

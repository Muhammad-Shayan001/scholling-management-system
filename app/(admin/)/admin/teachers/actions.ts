'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface TeacherInput {
  full_name: string;
  email: string;
  employee_number: string;
  department: string;
  qualification: string;
  experience_years: number;
  joining_date: string;
  campus_id: string;
}

export async function createTeacher(input: TeacherInput) {
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
    // 1. Create Auth User first (since teacher must have a profile)
    const randomPassword = crypto.randomBytes(12).toString('base64');
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: input.email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { full_name: input.full_name, role: 'teacher' }
    });

    if (authError) throw authError;

    // 2. Create Profile
    await adminSupabase.from('profiles').insert({
      id: authUser.user.id,
      email: input.email,
      full_name: input.full_name,
      role: 'teacher',
    });

    // 3. Create Teacher Record
    const { data: teacher, error: teacherError } = await adminSupabase
      .from('teachers')
      .insert({
        organization_id: orgId,
        campus_id: input.campus_id,
        user_id: authUser.user.id,
        employee_number: input.employee_number,
        department: input.department,
        qualification: input.qualification,
        experience_years: input.experience_years,
        joining_date: input.joining_date,
      })
      .select()
      .single();

    if (teacherError) throw teacherError;

    revalidatePath('/admin/teachers');
    return { success: true, teacherId: teacher.id };
  } catch (error: any) {
    return { error: error.message || 'Failed to create teacher' };
  }
}

export async function updateTeacher(teacherId: string, input: Partial<TeacherInput>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('teachers')
    .update(input)
    .eq('id', teacherId);

  if (error) return { error: error.message };
  revalidatePath('/admin/teachers');
  return { success: true };
}

export async function deleteTeacher(teacherId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', teacherId);

  if (error) return { error: error.message };
  revalidatePath('/admin/teachers');
  return { success: true };
}

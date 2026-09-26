'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface StudentInput {
  full_name: string;
  email: string;
  admission_number: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  address?: string;
  campus_id: string;
}

export async function createStudent(input: StudentInput) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // 1. Find Organization ID
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return { error: 'Organization not found' };
  const orgId = membership.organization_id;

  try {
    // 2. Create Student Record
    const { data: student, error: studentError } = await adminSupabase
      .from('students')
      .insert({
        organization_id: orgId,
        campus_id: input.campus_id,
        full_name: input.full_name,
        email: input.email,
        admission_number: input.admission_number,
        date_of_birth: input.date_of_birth,
        gender: input.gender,
        blood_group: input.blood_group,
        address: input.address,
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // 3. Create corresponding Auth User (to give them login access)
    // Note: In a real system, we might send an invite instead of creating a random password
    const randomPassword = crypto.randomBytes(12).toString('base64');

    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: input.email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { full_name: input.full_name }
    });

    if (authError) throw authError;

    // 4. Link Auth User to Profile and Student
    await adminSupabase.from('profiles').insert({
      id: authUser.user.id,
      email: input.email,
      full_name: input.full_name,
      role: 'student',
    });

    await adminSupabase
      .from('students')
      .update({ user_id: authUser.user.id })
      .eq('id', student.id);

    revalidatePath('/admin/students');
    return { success: true, studentId: student.id };
  } catch (error: any) {
    return { error: error.message || 'Failed to create student' };
  }
}

export async function updateStudent(studentId: string, input: Partial<StudentInput>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('students')
    .update(input)
    .eq('id', studentId);

  if (error) return { error: error.message };
  revalidatePath('/admin/students');
  return { success: true };
}

export async function deleteStudent(studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  if (error) return { error: error.message };
  revalidatePath('/admin/students');
  return { success: true };
}

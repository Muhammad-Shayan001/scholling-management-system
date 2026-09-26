'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface EnrollmentInput {
  student_id: string;
  class_id: string;
  academic_year: string;
  roll_number?: string;
}

export async function enrollStudent(input: EnrollmentInput) {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    // 2. Check for existing active enrollment in the same academic year
    const { data: existing } = await supabase
      .from('student_enrollments')
      .select('id')
      .eq('student_id', input.student_id)
      .eq('academic_year', input.academic_year)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return { error: 'Student is already actively enrolled in a class for this academic year' };
    }

    // 3. Perform Enrollment
    const { error } = await supabase
      .from('student_enrollments')
      .insert({
        student_id: input.student_id,
        class_id: input.class_id,
        academic_year: input.academic_year,
        roll_number: input.roll_number,
        status: 'active',
      });

    if (error) throw error;

    revalidatePath('/admin/academic');
    revalidatePath('/admin/students');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to enroll student' };
  }
}

export async function updateEnrollmentStatus(enrollmentId: string, status: 'active' | 'completed' | 'withdrawn') {
  const supabase = await createClient();
  const { error } = await supabase
    .from('student_enrollments')
    .update({ status })
    .eq('id', enrollmentId);

  if (error) return { error: error.message };
  revalidatePath('/admin/academic');
  return { success: true };
}

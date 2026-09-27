'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface CourseInput {
  name: string;
  description: string;
  organization_id: string;
  campus_id: string;
  teacher_id: string;
}

export async function createCourse(input: CourseInput) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const { data, error } = await adminSupabase
      .from('courses')
      .insert({
        name: input.name,
        description: input.description,
        organization_id: input.organization_id,
        campus_id: input.campus_id,
        teacher_id: input.teacher_id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/teacher/lms');
    return { success: true, courseId: data.id };
  } catch (error: any) {
    return { error: error.message || 'Failed to create course' };
  }
}

export interface ModuleInput {
  course_id: string;
  title: string;
  content: string;
  order: number;
}

export async function createModule(input: ModuleInput) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  try {
    const { error } = await adminSupabase
      .from('course_modules')
      .insert({
        course_id: input.course_id,
        title: input.title,
        content: input.content,
        sort_order: input.order,
      });

    if (error) throw error;

    revalidatePath('/teacher/lms');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to create module' };
  }
}

export interface AssignmentInput {
  course_id: string;
  title: string;
  description: string;
  max_marks: number;
  deadline: string;
  attachment_url?: string;
}

export async function createAssignment(input: AssignmentInput) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  try {
    const { error } = await adminSupabase
      .from('assignments')
      .insert({
        course_id: input.course_id,
        title: input.title,
        description: input.description,
        max_marks: input.max_marks,
        deadline: input.deadline,
        attachment_url: input.attachment_url,
      });

    if (error) throw error;

    revalidatePath('/teacher/lms');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to create assignment' };
  }
}

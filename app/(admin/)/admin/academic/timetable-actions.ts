'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface TimetableInput {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  room_number: string;
  academic_year: string;
}

export async function updateTimetable(input: TimetableInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const { error } = await supabase
      .from('timetable')
      .upsert({
        class_id: input.class_id,
        subject_id: input.subject_id,
        teacher_id: input.teacher_id,
        day_of_week: input.day_of_week,
        period_number: input.period_number,
        start_time: input.start_time,
        end_time: input.end_time,
        room_number: input.room_number,
        academic_year: input.academic_year,
      });

    if (error) throw error;

    revalidatePath('/admin/academic');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update timetable' };
  }
}

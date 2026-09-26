import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data: students } = await supabase.from('student_profiles').select('*');
  const classId = students[0].class_id;
  const schoolId = students[0].school_id;

  const { data: exams, error } = await supabase.from('exam_schedules').select('*');
  
  if (exams.length > 0) {
    // Update the first exam to match the first student's class_id
    await supabase.from('exam_schedules').update({ class_id: classId, school_id: schoolId }).eq('id', exams[0].id);
    console.log('Updated exam to point to student class:', classId);
  } else {
    // Create an exam
    const { data: subjects } = await supabase.from('subjects').select('id');
    if (subjects?.length) {
      await supabase.from('exam_schedules').insert({
        school_id: schoolId,
        class_id: classId,
        subject_id: subjects[0].id,
        exam_date: new Date().toISOString().split('T')[0],
        start_time: '10:00:00',
        end_time: '12:00:00',
        title: 'Mid Term Exam'
      });
      console.log('Created exam for class:', classId);
    }
  }
}
fix();
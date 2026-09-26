import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await adminClient
    .from('exam_schedules')
    .select(`
      *,
      subjects(name),
      classes(name, section),
      profiles!teacher_id(full_name)
    `)
    .eq('class_id', 'b9ea2985-c8d4-4b81-8666-4129d0341983')
    .order('exam_date', { ascending: true });

  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
main();
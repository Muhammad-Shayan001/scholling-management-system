import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  const tables = [
    'schools', 'profiles', 'classes', 'student_profiles', 'teacher_profiles', 
    'subjects', 'timetable', 'exam_timetable', 'assignments', 'attendance', 
    'results', 'announcements', 'notifications', 'conversations', 
    'conversation_participants', 'messages'
  ];

  console.log('Checking tables...');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    } else {
      console.log(`✅ Table ${table}: Exists`);
    }
  }
}

checkTables();

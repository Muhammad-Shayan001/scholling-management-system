import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchool() {
  const schoolId = '48a3bafd-b1f0-4adb-a221-20350fbd909a';
  const { data: school, error } = await supabase.from('schools').select('*').eq('id', schoolId).single();
  if (error) {
    console.error('School error:', error.message);
  } else {
    console.log('School found:', school);
  }
}
checkSchool();

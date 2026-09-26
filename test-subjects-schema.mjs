import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubjects() {
  const { data, error } = await supabase.from('subjects').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Cols:", data && data.length > 0 ? Object.keys(data[0]) : "No data, but table exists.");
    // Force error to get cols
    const { error: err } = await supabase.from('subjects').insert({ bogus_col: 'test' });
    console.log("Err details:", err);
  }
}

checkSubjects();

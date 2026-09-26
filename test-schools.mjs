import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchools() {
  const { data: schools, error } = await supabase.from('schools').select('*');
  if (error) console.error("Error:", error);
  console.log("Total Schools:", schools?.length);
  if (schools?.length > 0) {
    console.log("All Schools:", JSON.stringify(schools, null, 2));
  }
}

checkSchools();

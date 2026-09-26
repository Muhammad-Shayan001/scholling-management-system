import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBucketFiles() {
  const { data, error } = await supabase.storage.from('profiles').list('school-logos');
  if (error) console.error("Error:", error);
  console.log("Files:", data);
}

checkBucketFiles();

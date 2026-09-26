import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpload() {
  const fileContent = "dummy image content";
  const { data, error } = await supabase.storage.from('profiles').upload('school-logos/test.txt', fileContent, {
    upsert: true,
  });
  if (error) {
    console.error("Upload error:", error);
  } else {
    console.log("Upload success:", data);
  }
}

testUpload();

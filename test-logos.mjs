import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLogos() {
  const { data: schools, error } = await supabase.from('schools').select('name, logo_url');
  if (error) console.error("Error:", error);
  console.log("Schools:");
  console.dir(schools);
}

checkLogos();

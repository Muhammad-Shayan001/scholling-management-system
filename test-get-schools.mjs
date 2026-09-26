import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGetSchools() {
  const { data, error } = await supabase
    .from('schools')
    .select('*, admin:profiles!schools_admin_id_fkey(id, full_name, email, status)')
    .order('created_at', { ascending: false });

  if (error) console.error("GET ERROR:", error);
  console.log("Data length:", data?.length);
}

testGetSchools();

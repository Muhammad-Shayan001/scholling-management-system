import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminCampuses() {
  const { data, error } = await supabase.from('admin_campuses').select('*').eq('admin_id', 'a84e10ae-5bdc-4d88-ad08-d0e103785727');
  console.log("admin_campuses for Admin 02:", data);
}

checkAdminCampuses();

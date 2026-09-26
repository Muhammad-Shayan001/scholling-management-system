import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdmins() {
  const { data: profiles, error } = await supabase.from('profiles').select('*').eq('role', 'admin').order('created_at', { ascending: false });
  console.log("Admins Profiles:", profiles);

  const { data: schools, error: sErr } = await supabase.from('schools').select('name, code, principal_name, admin_id').order('created_at', { ascending: false }).limit(3);
  console.log("Latest Schools:", schools);
}

testAdmins();

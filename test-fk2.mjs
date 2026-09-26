import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testQuery2() {
  const { data, error } = await supabase.from('schools').select('*, admin:profiles(id, full_name, email, status)');
  console.log("With admin:profiles() error:", error?.message);
  console.log("Data:", data ? data[0] : null);
}
testQuery2();

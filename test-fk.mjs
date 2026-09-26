import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testQuery() {
  const { data, error } = await supabase.from('schools').select('*, profiles!admin_id(id, full_name)');
  console.log("With profiles!admin_id error:", error?.message);

  const { data: data2, error: error2 } = await supabase.from('schools').select('*, profiles(id, full_name)');
  console.log("With profiles() error:", error2?.message);
}
testQuery();

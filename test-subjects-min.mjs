import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCols() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'subjects' });
  if (error) {
     console.error("RPC failed, trying raw insert");
     // Try inserting minimal
     const { error: err } = await supabase.from('subjects').insert({ name: 'Test Subj' }).select();
     console.log("Minimal insert error:", err);
  } else {
    console.log(data);
  }
}

checkCols();

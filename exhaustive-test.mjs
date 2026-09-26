import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPolicies() {
  console.log('Fetching policies for schools table...');
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'schools' });
  
  if (error) {
    // If RPC doesn't exist, try a manual query to pg_policies
    const { data: policies, error: pgError } = await supabase.from('pg_policies').select('*').eq('tablename', 'schools');
    if (pgError) {
       console.error('Error fetching policies:', pgError.message);
    } else {
       console.log('Policies found:', policies);
    }
  } else {
    console.log('Policies found:', data);
  }
}

// Since I can't run RPC easily without creating it, I'll use a direct SQL check via rpc if it exists, 
// or I'll just try to insert and see the EXHAUSTIVE error.

async function exhaustiveTest() {
  const { data, error } = await supabase
    .from('schools')
    .insert({ name: 'Exhaustive Test', code: 'EXH-01' })
    .select();
    
  if (error) {
    console.log('INSERT ERROR:', error);
  } else {
    console.log('INSERT SUCCESS:', data);
  }
}

exhaustiveTest();

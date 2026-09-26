import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Using URL:', supabaseUrl);
console.log('Using Key:', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'NONE');

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing school insertion...');
  const { data, error } = await supabase.from('schools').insert({
    name: 'Test School API',
    code: 'TS-API-01',
    school_type: 'Primary School',
    established_year: 2024,
    settings: {}
  }).select().single();

  if (error) {
    console.error('INSERT ERROR:', error);
  } else {
    console.log('INSERT SUCCESS:', data);
  }
}

run();

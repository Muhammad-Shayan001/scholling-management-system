import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
  console.log('Testing RLS on profiles table using ANON key...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .limit(1);

  if (profileError) {
    console.error('Profile fetch error:', profileError);
  } else {
    console.log('Profile fetch result:', profile);
  }
}

testRLS();

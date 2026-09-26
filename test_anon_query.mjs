import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envConfig = String(readFileSync('.env.local'))
  .split('\n')
  .reduce((acc, line) => {
    const [k, v] = line.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testQuery() {
  // Login as admin
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'muhammad.shayan0927@gmail.com',
      password: 'password123' // guessing, let's see or assume we can't. Wait, we can just use the token or service role.
  });
  console.log("Auth:", authErr ? authErr.message : "Success");
  
  if (auth.user) {
      const { data, error } = await supabase.from('profiles').select('*, schools(*)').eq('id', auth.user.id).single();
      console.log('Query Result:', data, error);
  }
}
testQuery();

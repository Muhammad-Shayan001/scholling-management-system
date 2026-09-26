import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envConfig = String(readFileSync('.env.local'))
  .split('\n')
  .reduce((acc, line) => {
    const [k, v] = line.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_policies_for_profiles');
  if (error) {
     // fallback if no rpc, let's just query pg_policies
     const { data: p, error: pe } = await supabase.from('pg_policies').select('*');
     console.log("fallback error:", pe); // pg_policies might not be exposed via API
  }
}
check();

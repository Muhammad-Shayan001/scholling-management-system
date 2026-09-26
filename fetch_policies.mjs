import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envConfig = String(readFileSync('.env.local')).split('\n').reduce((acc, line) => {
    const [k, v] = line.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
}, {});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'objects');
  console.log("Policies:", data);
}
check();

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envConfig = String(readFileSync('.env.local')).split('\n').reduce((acc, line) => {
    const [k, v] = line.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
}, {});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('student_profiles').select('*, classes(name, section)').limit(1).single();
  console.log("Error students:", error);
  const { data: d2, error: e2 } = await supabase.from('teacher_profiles').select('*, classes(name, section)').limit(1).single();
  console.log("Error teachers:", e2);
}
test();

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

async function inspect() {
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) { console.log("User err", uErr); return; }
  console.log("Users:", users?.users?.map(u => ({ id: u.id, email: u.email })));

  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log("Profiles:", profiles);
  console.log("Profile Error:", pErr);
}
inspect();

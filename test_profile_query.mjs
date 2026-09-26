import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

const envConfig = dotenv.parse(readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testQuery() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) console.error('Error fetching profiles:', error);
  else {
      console.log('Profiles data:', data);
      if (data.length > 0) {
          const profile = data[0];
          console.log('Found profile:', profile.id, profile.role);
          
          if (profile.role === 'admin' || profile.role === 'super_admin') {
              const { data: admin, error: adminErr } = await supabase.from('admins').select('*').eq('user_id', profile.id).single();
              console.log('Admin fetch:', adminErr || admin);
          } else if (profile.role === 'teacher') {
              const { data: teacher, error: tErr } = await supabase.from('teacher_profiles').select('*').eq('user_id', profile.id).single();
              console.log('Teacher fetch:', tErr || teacher);
          }
      }
  }
}
testQuery();

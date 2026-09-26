import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdmin() {
  const email = 'ayankhan56521@gmail.com';
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (!profile) return console.log('No profile');

  const { data: admins } = await supabase.from('admins').select('*').eq('user_id', profile.id);
  console.log('Admins records:', admins);
}
checkAdmin();

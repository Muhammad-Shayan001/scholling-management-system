import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFullProfile() {
  const email = 'ayankhan56521@gmail.com';
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (!profile) return console.log('No profile');

  const userId = profile.id;
  
  // Simulate getFullProfile logic
  const { data: profileFull, error: profileErr } = await supabase
    .from('profiles')
    .select('*, schools!fk_school(*)')
    .eq('id', userId)
    .single();

  if (profileErr) return console.error('Profile fetch error:', profileErr.message);

  const { data: admin, error: adminErr } = await supabase.from('admins').select('*').eq('user_id', userId).single();
  
  console.log('Full Profile Simulation:', {
    profile: profileFull,
    admin: admin,
    adminError: adminErr?.message
  });
}

testFullProfile();

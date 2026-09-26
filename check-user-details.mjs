import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const email = 'ayankhan56521@gmail.com';
  console.log('Checking user:', email);

  // Check Auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    console.log('User not found in Auth.');
    return;
  }

  console.log('User found in Auth:', user.id);
  console.log('User Metadata:', JSON.stringify(user.user_metadata, null, 2));

  // Check Profile
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id);

  if (profileError) {
    console.error('Profile error:', profileError.message);
  } else {
    console.log('Profiles found count:', profiles?.length);
    console.log('Profiles found:', JSON.stringify(profiles, null, 2));
  }
}

checkUser();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSuperAdminLogin() {
  const email = 'ayankhan56521@gmail.com';
  const password = 'Superadmin123@';

  console.log(`Attempting login for ${email}...`);
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.error('❌ Login Error:', loginError.message);
  } else {
    console.log('✅ Login successful! User ID:', data.user.id);
    console.log('User Role in Metadata:', data.user.user_metadata?.role);
    console.log('User Status in Metadata:', data.user.user_metadata?.status);
  }
}

testSuperAdminLogin();

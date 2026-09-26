import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminCreationAndLogin() {
  const email = `test-admin-${Date.now()}@gmail.com`;
  const password = 'TestPassword123!';
  const schoolId = '48a3bafd-b1f0-4adb-a221-20350fbd909a';

  console.log(`Creating test admin: ${email}...`);
  
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin', school_id: schoolId }
  });

  if (authError) return console.error('Auth Error:', authError.message);
  console.log('✅ Auth user created:', authUser.user.id);

  const { error: profileError } = await adminSupabase.from('profiles').insert({
    id: authUser.user.id,
    email,
    role: 'admin',
    school_id: schoolId,
    status: 'approved'
  });

  if (profileError) return console.error('Profile Error:', profileError.message);
  console.log('✅ Profile created.');

  console.log('Attempting login...');
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.error('❌ Login Failed:', loginError.message, loginError.status);
  } else {
    console.log('🎉 Login successful! Token received.');
  }
}

testAdminCreationAndLogin();

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

async function testAdminLogin() {
  const email = 'admin12@gmail.com'; // One of the recent admins
  const testPassword = 'TestPassword123!';

  console.log(`Resetting password for ${email}...`);
  
  // Find user ID
  const { data: { users } } = await adminSupabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) return console.error('User not found in Auth');

  const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
    password: testPassword
  });

  if (updateError) return console.error('Update Error:', updateError.message);
  console.log('Password reset successful.');

  console.log('Attempting login...');
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: testPassword
  });

  if (loginError) {
    console.error('Login Error:', loginError.message);
  } else {
    console.log('Login successful! User ID:', data.user.id);
  }
}

testAdminLogin();

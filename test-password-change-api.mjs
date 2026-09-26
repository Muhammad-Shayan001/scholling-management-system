import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testPasswordChange() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, anonKey);

  // Sign in as a test user or super admin
  console.log('Logging in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'skolic.official@gmail.com',
    password: 'password123' // Or whatever it is right now
  });

  if (error) {
    console.error('Login error:', error.message);
    return;
  }

  console.log('User logged in:', data.user.id);

  console.log('Attempting password update...');
  const { error: updateError } = await supabase.auth.updateUser({
    password: 'password123' // Changing to same password for testing
  });

  if (updateError) {
    console.error('Update password error:', updateError.message);
  } else {
    console.log('✅ Update password successful');
  }
}

testPasswordChange();
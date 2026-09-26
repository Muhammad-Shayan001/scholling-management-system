import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAndTest() {
  const email = 'admin01@gmail.com';
  console.log(`Resetting password for ${email}...`);
  
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error('User not found');
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: 'Password123!'
  });

  if (error) {
    console.error('Reset failed:', error.message);
  } else {
    console.log('Password reset to: Password123!');
  }
}

resetAndTest();

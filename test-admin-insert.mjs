import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminInsert() {
  const email = 'admin01@gmail.com';
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error('User not found');
    return;
  }

  console.log(`Attempting insert for ${email} (${user.id})...`);
  
  const { data, error } = await supabase
    .from('schools')
    .insert({ 
      name: 'Admin Ownership Test', 
      code: 'AOT-' + Date.now(),
      admin_id: user.id 
    })
    .select();
    
  if (error) {
    console.log('INSERT ERROR:', error);
  } else {
    console.log('INSERT SUCCESS:', data);
  }
}

testAdminInsert();

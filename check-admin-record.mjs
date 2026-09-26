import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminRecord() {
  const email = 'ayankhan56521@gmail.com';
  console.log('Checking admin record for:', email);

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', email)
    .single();

  if (!profile) {
    console.log('Profile not found.');
    return;
  }

  console.log('Profile found:', profile);

  if (profile.role === 'super_admin' || profile.role === 'admin') {
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (adminError) {
      console.error('Admin record error:', adminError.message);
    } else {
      console.log('Admin record found:', admin);
    }
  }
}

checkAdminRecord();

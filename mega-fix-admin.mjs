import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function megaFix() {
  const email = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  console.log('🚀 Starting Mega Fix for Super Admin:', email);

  if (!email) {
    console.error('❌ NEXT_PUBLIC_SUPER_ADMIN_EMAIL is not set!');
    return;
  }

  // 1. Find user in Auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) return console.error('Auth Error:', authError.message);

  const user = users.find(u => u.email === email);
  if (!user) {
    console.error('❌ User not found in Auth. Please register first.');
    return;
  }

  console.log('✅ User found in Auth:', user.id);

  // 2. Update Auth Metadata
  const { error: metaError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      role: 'super_admin',
      status: 'approved',
      full_name: user.user_metadata.full_name || 'Super Admin'
    }
  });
  if (metaError) console.error('Meta Update Error:', metaError.message);
  else console.log('✅ Auth metadata updated.');

  // 3. Update Profiles table
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: email,
    role: 'super_admin',
    status: 'approved',
    full_name: user.user_metadata.full_name || 'Super Admin',
    updated_at: new Date().toISOString()
  });
  if (profileError) console.error('Profile Update Error:', profileError.message);
  else console.log('✅ Profiles table updated.');

  // 4. Ensure record in 'admins' table
  const { data: adminRecord } = await supabase.from('admins').select('*').eq('user_id', user.id).single();
  if (!adminRecord) {
    console.log('⚠️ Admin record missing. Creating...');
    const { error: adminError } = await supabase.from('admins').insert({
      user_id: user.id,
      phone: user.user_metadata.phone || null,
      school_id: '48a3bafd-b1f0-4adb-a221-20350fbd909a' // Assign to Global Institute
    });
    if (adminError) console.error('Admin Insert Error:', adminError.message);
    else console.log('✅ Admin record created.');
  } else {
    console.log('✅ Admin record already exists.');
  }

  console.log('🎉 Mega Fix complete! Please try logging in now.');
}

megaFix();

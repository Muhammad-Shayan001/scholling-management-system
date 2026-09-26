import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSuperAdmin() {
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  console.log('Target Super Admin:', superAdminEmail);

  if (!superAdminEmail) {
    console.error('❌ NEXT_PUBLIC_SUPER_ADMIN_EMAIL not set in .env.local');
    return;
  }

  // 1. Find user in auth.users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('❌ Auth error:', authError.message);
    return;
  }

  const superUser = users.find(u => u.email === superAdminEmail);

  if (!superUser) {
    console.log('❌ Super Admin user not found in Auth. Please sign up first or create manually.');
    return;
  }

  console.log('✅ Found Auth User:', superUser.id);

  // 2. Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', superUser.id)
    .single();

  if (profile) {
    console.log('✅ Profile exists:', profile.role);
    if (profile.role !== 'super_admin') {
      console.log('⚠️ Fixing role to super_admin...');
      await supabase.from('profiles').update({ role: 'super_admin', status: 'approved' }).eq('id', superUser.id);
    }
    return;
  }

  console.log('⚠️ Profile missing. Creating Super Admin profile...');
  const { error: insertError } = await supabase.from('profiles').insert({
    id: superUser.id,
    email: superAdminEmail,
    full_name: 'Super Admin',
    role: 'super_admin',
    status: 'approved'
  });

  if (insertError) {
    console.error('❌ Insert error:', insertError.message);
  } else {
    console.log('🚀 Super Admin profile created successfully!');
  }
}

fixSuperAdmin();

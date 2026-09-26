import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSync() {
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
  if (profileError) {
    console.error('Profile error:', profileError);
    return;
  }

  const profileIds = new Set(profiles?.map(p => p.id));
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

  for (const user of authUsers?.users || []) {
    if (!profileIds.has(user.id)) {
      console.log(`Missing profile for ${user.email}, creating...`);
      const isSuperAdmin = user.email === superAdminEmail;
      
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Admin User',
        role: isSuperAdmin ? 'super_admin' : 'student',
        status: isSuperAdmin ? 'approved' : 'pending'
      });

      if (insertError) {
        console.error(`Failed to create profile for ${user.email}:`, insertError);
      } else {
        console.log(`Successfully created profile for ${user.email}`);
      }
    }
  }

  const { data: updatedProfiles } = await supabase.from('profiles').select('*');
  console.log('\nUpdated Profiles:');
  updatedProfiles?.forEach(p => console.log(`- ${p.email} (id: ${p.id}, role: ${p.role}, status: ${p.status})`));
}

checkAndSync();

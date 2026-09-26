import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listRecentUsers() {
  console.log('Fetching recent users from Auth...');
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) return console.error('Auth Error:', authError.message);

  const sortedUsers = users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  console.log('Recent 5 users in Auth:');
  sortedUsers.slice(0, 5).forEach(u => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}, Role: ${u.user_metadata.role}`);
  });

  console.log('\nFetching recent users from Profiles...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (profileError) return console.error('Profile Error:', profileError.message);

  console.log('Recent 5 profiles:');
  profiles.forEach(p => {
    console.log(`- ID: ${p.id}, Email: ${p.email}, Role: ${p.role}, Status: ${p.status}`);
  });
}

listRecentUsers();

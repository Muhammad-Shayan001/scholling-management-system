import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminProfile() {
  const email = 'admin01@gmail.com';
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error('User not found');
    return;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  console.log('Profile Details:', profile);

  // Check if they are linked to any school as admin_id
  const { data: schools } = await supabase.from('schools').select('*').eq('admin_id', user.id);
  console.log('Schools where they are admin_id:', schools.map(s => s.name));

  // Check their parent school
  if (profile.school_id) {
    const { data: parent } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    console.log('Parent School:', parent?.name);
    
    // Check children of this parent
    const { data: children } = await supabase.from('schools').select('*').eq('parent_school_id', profile.school_id);
    console.log('Child Campuses found:', children.map(s => s.name));
  }
}

checkAdminProfile();

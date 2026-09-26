import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectCampuses() {
  console.log('Inspecting all schools/campuses in the database...');
  
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, code, parent_school_id, admin_id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`Total Schools/Campuses found: ${schools.length}`);
  schools.forEach(s => {
    console.log(`- [${s.id}] ${s.name} (Code: ${s.code}, Parent: ${s.parent_school_id}, Admin: ${s.admin_id})`);
  });

  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const superAdmin = users.find(u => u.email === superAdminEmail);
  
  if (superAdmin) {
    console.log('\nSuper Admin ID:', superAdmin.id);
    const managed = schools.filter(s => s.admin_id === superAdmin.id);
    console.log(`Schools managed by Super Admin: ${managed.length}`);
  }
}

inspectCampuses();

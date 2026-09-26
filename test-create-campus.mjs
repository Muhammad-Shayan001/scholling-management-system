import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreateCampus() {
  console.log('Testing campus creation...');
  
  // 1. Get a mock admin user (e.g. the super admin)
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === superAdminEmail);
  
  if (!user) {
    console.error('Super admin user not found');
    return;
  }

  // 2. Mock formData
  const formData = {
    name: 'Test Campus ' + Date.now(),
    campus_code: 'TEST-' + Math.floor(Math.random() * 1000),
    campus_type: 'branch',
    theme_color: '#ff0000'
  };

  // 3. Try to insert directly into schools
  console.log('Attempting direct insert into schools...');
  const { data: campus, error: createError } = await supabase
    .from('schools')
    .insert({
      name: formData.name,
      code: formData.campus_code,
      campus_code: formData.campus_code,
      campus_type: formData.campus_type,
      theme_color: formData.theme_color,
      is_active: true,
      admin_id: user.id,
    })
    .select()
    .single();

  if (createError) {
    console.error('FAILED to create campus:', createError.message);
    console.error('Error Code:', createError.code);
    console.error('Hint:', createError.hint);
  } else {
    console.log('SUCCESS: Campus created with ID:', campus.id);
    
    // 4. Try to link admin
    console.log('Attempting to link admin in admin_campuses...');
    const { error: linkError } = await supabase
      .from('admin_campuses')
      .insert({
        admin_id: user.id,
        school_id: campus.id,
        is_primary: false
      });
      
    if (linkError) {
      console.error('FAILED to link admin:', linkError.message);
    } else {
      console.log('SUCCESS: Admin linked to campus');
    }
  }
}

testCreateCampus();

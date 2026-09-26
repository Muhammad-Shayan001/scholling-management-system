import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseCreation() {
  console.log('--- START DIAGNOSIS ---');
  
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === superAdminEmail);
  
  if (!user) {
    console.error('Super admin user not found');
    return;
  }

  // Get profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  console.log('Admin Profile School ID:', profile.school_id);

  // MOCK FORM DATA (Exactly like the UI)
  const formData = {
    name: 'City Branch ' + Math.floor(Math.random() * 100),
    campus_code: 'CB-' + Math.floor(Math.random() * 100),
    campus_type: 'branch',
    address: '123 Test Street',
    phone: '123456789',
    email: 'branch@test.com',
    principal_name: 'Branch Principal',
    theme_color: '#6366f1'
  };

  console.log('Attempting insert with ALL multi-campus columns...');
  const { data: campus, error: createError } = await supabase
    .from('schools')
    .insert({
      name: formData.name,
      code: formData.campus_code, // Main code column
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      principal_name: formData.principal_name,
      campus_code: formData.campus_code, // New column
      campus_type: formData.campus_type, // New column
      theme_color: formData.theme_color, // New column
      is_active: true,
      parent_school_id: profile.school_id || null, // New column
      admin_id: user.id,
    })
    .select()
    .single();

  if (createError) {
    console.error('INSERT FAILED:', createError.message);
    console.error('Error Details:', createError);
  } else {
    console.log('INSERT SUCCESS: Campus ID:', campus.id);
    
    // Try junction table
    const { error: linkError } = await supabase
      .from('admin_campuses')
      .insert({ admin_id: user.id, school_id: campus.id });
      
    if (linkError) {
      console.error('JUNCTION INSERT FAILED:', linkError.message);
    } else {
      console.log('JUNCTION SUCCESS');
    }
  }
}

diagnoseCreation();

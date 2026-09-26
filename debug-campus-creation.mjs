// Removed broken import
// Since I'm in a project, I can't easily import TS from MJS without setup.
// I'll create a standalone script that uses the same logic.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const userId = '3e6a4b12-5c21-4f8a-9e12-3b4c5d6e7f8a'; // Need a real admin ID
  // Let's find an admin ID first.
  const { data: profile } = await adminClient.from('profiles').select('id, school_id').eq('role', 'admin').limit(1).single();
  
  if (!profile) {
    console.log('No admin found');
    return;
  }

  console.log('Testing with admin:', profile.id);

  const formData = {
    name: 'Debug Campus ' + Date.now(),
    campus_code: 'DBG-' + Date.now(),
    address: '123 Debug St',
    campus_type: 'branch'
  };

  const name = formData.name;
  const code = formData.campus_code;

  console.log('Attempting insert into schools...');
  const { data: campus, error: createError } = await adminClient
    .from('schools')
    .insert({
      name,
      code: code || name.toLowerCase().replace(/\s+/g, '-'),
      address: formData.address || null,
      campus_code: code || null,
      campus_type: formData.campus_type || 'branch',
      is_active: true,
      parent_school_id: profile.school_id || null,
      admin_id: profile.id,
    })
    .select()
    .single();

  if (createError) {
    console.error('Schools Insert Error:', createError);
    return;
  }

  console.log('✅ School created:', campus.id);

  console.log('Attempting insert into admin_campuses...');
  const { error: linkError } = await adminClient.from('admin_campuses').insert({
    admin_id: profile.id,
    school_id: campus.id,
    is_primary: false,
  });

  if (linkError) {
    console.error('Admin Campuses Link Error:', linkError);
    return;
  }

  console.log('✅ Admin linked to campus');

  console.log('Attempting insert into classes...');
  const classNames = Array.from({ length: 3 }, (_, i) => `Class ${i + 1}`);
  const classInserts = classNames.map(cn => ({
    name: cn,
    school_id: campus.id,
    section: 'A',
  }));
  const { error: classError } = await adminClient.from('classes').insert(classInserts);

  if (classError) {
    console.error('Classes Seed Error:', classError);
    return;
  }

  console.log('✅ Classes seeded');
  console.log('TEST PASSED');
}

test();
